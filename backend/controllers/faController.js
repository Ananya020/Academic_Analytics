
import { supabase } from '../config/supabaseClient.js';
import { parseCsvBuffer } from '../utils/csvParser.js';

// Generic upload handler
const handleUpload = async (req, res, tableName, requiredFields, upsertDataMapper) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please select a file.' });
    }
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
        return res.status(400).json({ error: 'File size exceeds 10MB limit. Please upload a smaller file.' });
    }
    
    const sectionId = req.user.section_id;
    if (!sectionId) {
        return res.status(400).json({ 
            error: 'Faculty Advisor is not assigned to any section. Please contact an administrator to assign you to a section.' 
        });
    }

    try {
        const data = await parseCsvBuffer(req.file.buffer);
        
        if (!data || data.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or contains no valid data.' });
        }
        
        // Validate headers
        const headers = Object.keys(data[0]);
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Missing required CSV columns: ${missingFields.join(', ')}. Required columns: ${requiredFields.join(', ')}` 
            });
        }

        // Map and validate data
        const upsertData = [];
        const errors = [];
        
        data.forEach((row, index) => {
            try {
                const mapped = upsertDataMapper(row, sectionId);
                // Validate required fields are not empty
                const emptyFields = requiredFields.filter(field => {
                    const value = mapped[field];
                    return value === undefined || value === null || value === '' || 
                           (typeof value === 'string' && value.trim() === '');
                });
                
                if (emptyFields.length > 0) {
                    errors.push(`Row ${index + 2}: Missing values for ${emptyFields.join(', ')}`);
                    return;
                }
                
                upsertData.push(mapped);
            } catch (err) {
                errors.push(`Row ${index + 2}: ${err.message}`);
            }
        });
        
        if (errors.length > 0 && errors.length === data.length) {
            return res.status(400).json({ 
                error: `All rows have errors. First error: ${errors[0]}` 
            });
        }
        
        if (upsertData.length === 0) {
            return res.status(400).json({ error: 'No valid data rows to upload.' });
        }
        
        // Upload in batches if too large (Supabase has limits)
        const batchSize = 1000;
        let totalUploaded = 0;
        
        // Determine conflict column based on table
        let conflictColumn = null;
        if (tableName === 'students') {
            conflictColumn = 'registration_number';
        } else if (tableName === 'performance') {
            // Performance table has unique constraint on (student_reg_no, subject_id, semester)
            // We'll use upsert which handles this automatically
        } else if (tableName === 'attendance') {
            // Attendance table has unique constraint on (student_reg_no, subject_id)
            // We'll use upsert which handles this automatically
        }
        
        for (let i = 0; i < upsertData.length; i += batchSize) {
            const batch = upsertData.slice(i, i + batchSize);
            
            // Use upsert - Supabase will handle conflicts based on primary keys/unique constraints
            const { error } = await supabase
                .from(tableName)
                .upsert(batch, { 
                    onConflict: conflictColumn || undefined
                });
            
            if (error) {
                console.error(`Batch upload error (rows ${i + 1}-${Math.min(i + batchSize, upsertData.length)}):`, error);
                throw new Error(`Database error: ${error.message}`);
            }
            
            totalUploaded += batch.length;
        }
        
        const message = errors.length > 0 
            ? `Successfully uploaded ${totalUploaded} records. ${errors.length} row(s) had errors and were skipped.`
            : `Successfully uploaded and processed ${totalUploaded} records.`;
        
        res.status(200).json({ 
            message,
            uploaded: totalUploaded,
            errors: errors.length > 0 ? errors.slice(0, 5) : [] // Return first 5 errors
        });
    } catch (err) {
        console.error(`Upload error for ${tableName}:`, err);
        res.status(500).json({ 
            error: err.message || 'An error occurred while processing the file. Please check the file format and try again.' 
        });
    }
};

// Upload students for the FA's section
export const uploadStudents = (req, res) => {
    const required = ['registration_number', 'name', 'gender', 'residence_type'];
    const mapper = (row, sectionId) => ({
        registration_number: row.registration_number,
        name: row.name,
        gender: row.gender,
        residence_type: row.residence_type,
        section_id: sectionId,
    });
    handleUpload(req, res, 'students', required, mapper);
};

// Upload performance data
export const uploadPerformance = (req, res) => {
    const required = ['student_reg_no', 'subject_id', 'marks', 'arrear_status', 'semester'];
    const mapper = (row) => ({
        student_reg_no: row.student_reg_no,
        subject_id: parseInt(row.subject_id),
        marks: parseInt(row.marks),
        arrear_status: row.arrear_status.toLowerCase() === 'true',
        semester: parseInt(row.semester),
    });
    handleUpload(req, res, 'performance', required, mapper);
};

// Upload attendance data
export const uploadAttendance = (req, res) => {
    const required = ['student_reg_no', 'subject_id', 'percentage'];
    const mapper = (row) => ({
        student_reg_no: row.student_reg_no,
        subject_id: parseInt(row.subject_id),
        percentage: parseFloat(row.percentage),
    });
    handleUpload(req, res, 'attendance', required, mapper);
};

// Get analytics for the FA's section
export const getFaAnalytics = async (req, res) => {
    const sectionId = req.user.section_id;
    if (!sectionId) {
        return res.status(400).json({ error: 'Faculty Advisor is not assigned to any section.' });
    }

    try {
        // First, get all student registration numbers for this section
        const { data: sectionStudents, error: studRegError } = await supabase
            .from('students')
            .select('registration_number')
            .eq('section_id', sectionId);
        
        if (studRegError) throw studRegError;
        
        if (!sectionStudents || sectionStudents.length === 0) {
            return res.status(200).json({ 
                message: 'No students found for this section.',
                totalStudents: 0,
                passPercentage: 0,
                failPercentage: 0,
                totalArrears: 0,
                arrearsData: [],
                hostelData: [],
                topStudents: [],
                genderDistribution: []
            });
        }
        
        const regNumbers = sectionStudents.map(s => s.registration_number);
        
        // Fetch performance data for the section
        const { data: performanceData, error: perfError } = await supabase
            .from('performance')
            .select('marks, arrear_status, student_reg_no, students(name)')
            .in('student_reg_no', regNumbers);
        if (perfError) throw perfError;

        const { data: studentsData, error: studError } = await supabase
            .from('students')
            .select('gender, residence_type')
            .eq('section_id', sectionId);
        if (studError) throw studError;

        if (!performanceData || performanceData.length === 0) {
            return res.status(200).json({ message: 'No performance data available for this section.' });
        }
        
        // Calculations
        const totalStudents = new Set(performanceData.map(p => p.student_reg_no)).size;
        const passedCount = performanceData.filter(p => !p.arrear_status).length;
        const failedCount = performanceData.filter(p => p.arrear_status).length;
        
        const studentMarks = performanceData.reduce((acc, curr) => {
            acc[curr.students.name] = (acc[curr.students.name] || 0) + curr.marks;
            return acc;
        }, {});

        const top5Students = Object.entries(studentMarks)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, total_marks]) => ({ name, total_marks }));

        const genderDist = studentsData.reduce((acc, stud) => {
            acc[stud.gender] = (acc[stud.gender] || 0) + 1;
            return acc;
        }, {});

        const residenceDist = studentsData.reduce((acc, stud) => {
            acc[stud.residence_type] = (acc[stud.residence_type] || 0) + 1;
            return acc;
        }, {});

        // Construct analytics object matching frontend expectations
        const analytics = {
            totalStudents,
            passPercentage: totalStudents > 0 ? ((passedCount / (passedCount + failedCount)) * 100).toFixed(2) : 0,
            failPercentage: totalStudents > 0 ? ((failedCount / (passedCount + failedCount)) * 100).toFixed(2) : 0,
            totalArrears: failedCount,
            // Charts data
            arrearsData: [
                { name: 'Passed', value: passedCount },
                { name: 'Failed', value: failedCount }
            ],
            hostelData: Object.entries(residenceDist).map(([name, value]) => ({ name, value })),
            topStudents: top5Students.map(s => ({ name: s.name, score: s.total_marks })),
            genderDistribution: Object.entries(genderDist).map(([name, value]) => ({ name, value }))
        };

        res.status(200).json(analytics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
