
import { supabase } from '../config/supabaseClient.js';
import { parseCsvBuffer } from '../utils/csvParser.js';
import { parseExcelBuffer } from '../utils/excelParser.js';

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

// Upload Excel file with multiple sheets
export const uploadExcel = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please select a file.' });
    }
    
    // Check file size (limit to 20MB for Excel files)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (req.file.size > maxSize) {
        return res.status(400).json({ error: 'File size exceeds 20MB limit. Please upload a smaller file.' });
    }
    
    const sectionId = req.user.section_id;
    if (!sectionId) {
        return res.status(400).json({ 
            error: 'Faculty Advisor is not assigned to any section. Please contact an administrator to assign you to a section.' 
        });
    }

    try {
        // Parse Excel file - get all sheets
        const sheetsData = await parseExcelBuffer(req.file.buffer);
        
        if (!sheetsData || Object.keys(sheetsData).length === 0) {
            return res.status(400).json({ error: 'Excel file is empty or contains no valid data.' });
        }

        const results = {
            students: { uploaded: 0, errors: [] },
            performance: { uploaded: 0, errors: [] },
            attendance: { uploaded: 0, errors: [] }
        };

        // Helper function to normalize column names (handle variations)
        const normalizeColumnName = (colName) => {
            const normalized = colName.toLowerCase().trim()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
            
            // Map common variations
            const columnMap = {
                'registration_number': 'registration_number',
                'reg_no': 'registration_number',
                'reg_number': 'registration_number',
                'registration_no': 'registration_number',
                'student_reg_no': 'student_reg_no',
                'student_reg_number': 'student_reg_no',
                'student_registration_number': 'student_reg_no',
                'subject_id': 'subject_id',
                'subject': 'subject_id',
                'sub_id': 'subject_id',
                'residence_type': 'residence_type',
                'residence': 'residence_type',
                'hostel': 'residence_type',
            };
            
            return columnMap[normalized] || normalized;
        };

        // Helper function to get column value with normalization
        const getColumnValue = (row, possibleNames) => {
            for (const name of possibleNames) {
                // Try exact match first
                if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                    return row[name];
                }
                
                // Try normalized match
                const normalized = normalizeColumnName(name);
                for (const key in row) {
                    if (normalizeColumnName(key) === normalized && row[key] !== undefined && row[key] !== null && row[key] !== '') {
                        return row[key];
                    }
                }
            }
            return undefined;
        };

        // Helper function to calculate grade from marks
        const calculateGrade = (marks) => {
            if (marks >= 90) return 'O';
            if (marks >= 80) return 'A+';
            if (marks >= 70) return 'A';
            if (marks >= 60) return 'B+';
            if (marks >= 50) return 'B';
            if (marks >= 40) return 'C';
            return 'F';
        };

        // Helper function to normalize gender values
        const normalizeGender = (gender) => {
            if (!gender) return null;
            const g = String(gender).trim();
            const lower = g.toLowerCase();
            if (lower === 'male' || lower === 'm') return 'Male';
            if (lower === 'female' || lower === 'f') return 'Female';
            if (lower === 'other' || lower === 'o') return 'Other';
            return g; // Return as-is if it matches one of the allowed values
        };

        // Helper function to normalize residence type
        const normalizeResidenceType = (residence) => {
            if (!residence) return null;
            const r = String(residence).trim();
            const lower = r.toLowerCase();
            if (lower.includes('hostel') || lower.includes('hostler')) return 'Hostler';
            if (lower.includes('day') || lower.includes('scholar')) return 'Day Scholar';
            return r; // Return as-is if it matches one of the allowed values
        };

        // Helper function to detect sheet type based on column names
        const detectSheetType = (headers) => {
            const normalizedHeaders = headers.map(h => normalizeColumnName(h));
            const lowerHeaders = headers.map(h => h.toLowerCase().trim());
            
            // Check for students sheet
            if ((normalizedHeaders.includes('registration_number')) && 
                (lowerHeaders.some(h => h.includes('name'))) && 
                (lowerHeaders.some(h => h.includes('gender')))) {
                return 'students';
            }
            
            // Check for performance sheet
            if ((normalizedHeaders.includes('student_reg_no') || normalizedHeaders.includes('registration_number')) && 
                (normalizedHeaders.includes('subject_id') || lowerHeaders.some(h => h.includes('subject'))) && 
                (lowerHeaders.some(h => h.includes('mark')))) {
                return 'performance';
            }
            
            // Check for attendance sheet
            if ((normalizedHeaders.includes('student_reg_no') || normalizedHeaders.includes('registration_number')) && 
                (normalizedHeaders.includes('subject_id') || lowerHeaders.some(h => h.includes('subject'))) && 
                (lowerHeaders.some(h => h.includes('percentage')) || lowerHeaders.some(h => h.includes('attendance')))) {
                return 'attendance';
            }
            
            return null;
        };

        // Process each sheet
        for (const [sheetName, data] of Object.entries(sheetsData)) {
            if (!data || data.length === 0) continue;
            
            const headers = Object.keys(data[0]);
            const sheetType = detectSheetType(headers);
            
            if (!sheetType) {
                console.warn(`Sheet "${sheetName}" could not be identified. Skipping.`);
                continue;
            }

            // Process based on sheet type
            if (sheetType === 'students') {
                const upsertData = [];
                data.forEach((row, index) => {
                    try {
                        const registrationNumber = getColumnValue(row, ['registration_number', 'reg_no', 'reg_number', 'registration_no']);
                        const name = getColumnValue(row, ['name', 'student_name', 'full_name']);
                        const gender = getColumnValue(row, ['gender', 'sex']);
                        const residenceType = getColumnValue(row, ['residence_type', 'residence', 'hostel']);
                        
                        const mapped = {
                            registration_number: registrationNumber,
                            name: name,
                            gender: normalizeGender(gender),
                            residence_type: normalizeResidenceType(residenceType),
                            section_id: sectionId,
                        };
                        
                        const required = ['registration_number', 'name', 'gender', 'residence_type'];
                        
                        // Validate required fields
                        const emptyFields = required.filter(field => {
                            const value = mapped[field];
                            return value === undefined || value === null || value === '' || 
                                   (typeof value === 'string' && value.trim() === '');
                        });
                        
                        if (emptyFields.length === 0) {
                            upsertData.push(mapped);
                        } else {
                            results.students.errors.push(`Row ${index + 2}: Missing ${emptyFields.join(', ')}`);
                        }
                    } catch (err) {
                        results.students.errors.push(`Row ${index + 2}: ${err.message}`);
                    }
                });

                // Upload students in batches
                const batchSize = 1000;
                for (let i = 0; i < upsertData.length; i += batchSize) {
                    const batch = upsertData.slice(i, i + batchSize);
                    const { error } = await supabase
                        .from('students')
                        .upsert(batch, { onConflict: 'registration_number' });
                    
                    if (error) throw new Error(`Students upload error: ${error.message}`);
                    results.students.uploaded += batch.length;
                }

            } else if (sheetType === 'performance') {
                const upsertData = [];
                data.forEach((row, index) => {
                    try {
                        const studentRegNo = getColumnValue(row, ['student_reg_no', 'registration_number', 'reg_no', 'reg_number']);
                        const subjectId = getColumnValue(row, ['subject_id', 'subject', 'sub_id']);
                        const marks = getColumnValue(row, ['marks', 'mark', 'score']);
                        const arrearStatus = getColumnValue(row, ['arrear_status', 'arrear', 'failed']);
                        const semester = getColumnValue(row, ['semester', 'sem']);
                        
                        const marksValue = parseInt(marks);
                        const gradeValue = calculateGrade(marksValue);
                        
                        const mapped = {
                            student_reg_no: studentRegNo,
                            subject_id: parseInt(subjectId),
                            marks: marksValue,
                            grade: gradeValue, // Required by schema - arrear_status is auto-generated from grade
                            semester: parseInt(semester),
                        };
                        
                        const required = ['student_reg_no', 'subject_id', 'marks', 'semester'];
                        
                        // Validate required fields
                        const emptyFields = required.filter(field => {
                            const value = mapped[field];
                            return value === undefined || value === null || value === '' || 
                                   (typeof value === 'string' && value.trim() === '');
                        });
                        
                        if (emptyFields.length === 0 && !isNaN(mapped.subject_id) && !isNaN(mapped.marks) && !isNaN(mapped.semester)) {
                            upsertData.push(mapped);
                        } else {
                            results.performance.errors.push(`Row ${index + 2}: Invalid data`);
                        }
                    } catch (err) {
                        results.performance.errors.push(`Row ${index + 2}: ${err.message}`);
                    }
                });

                // Upload performance in batches
                const batchSize = 1000;
                for (let i = 0; i < upsertData.length; i += batchSize) {
                    const batch = upsertData.slice(i, i + batchSize);
                    const { error } = await supabase
                        .from('performance')
                        .upsert(batch);
                    
                    if (error) throw new Error(`Performance upload error: ${error.message}`);
                    results.performance.uploaded += batch.length;
                }

            } else if (sheetType === 'attendance') {
                const upsertData = [];
                data.forEach((row, index) => {
                    try {
                        const studentRegNo = getColumnValue(row, ['student_reg_no', 'registration_number', 'reg_no', 'reg_number']);
                        const subjectId = getColumnValue(row, ['subject_id', 'subject', 'sub_id']);
                        const percentage = getColumnValue(row, ['percentage', 'attendance', 'attendance_percentage']);
                        
                        const mapped = {
                            student_reg_no: studentRegNo,
                            subject_id: parseInt(subjectId),
                            percentage: parseFloat(percentage),
                        };
                        
                        const required = ['student_reg_no', 'subject_id', 'percentage'];
                        
                        // Validate required fields
                        const emptyFields = required.filter(field => {
                            const value = mapped[field];
                            return value === undefined || value === null || value === '' || 
                                   (typeof value === 'string' && value.trim() === '');
                        });
                        
                        if (emptyFields.length === 0 && !isNaN(mapped.subject_id) && !isNaN(mapped.percentage)) {
                            upsertData.push(mapped);
                        } else {
                            results.attendance.errors.push(`Row ${index + 2}: Invalid data`);
                        }
                    } catch (err) {
                        results.attendance.errors.push(`Row ${index + 2}: ${err.message}`);
                    }
                });

                // Upload attendance in batches
                const batchSize = 1000;
                for (let i = 0; i < upsertData.length; i += batchSize) {
                    const batch = upsertData.slice(i, i + batchSize);
                    const { error } = await supabase
                        .from('attendance')
                        .upsert(batch);
                    
                    if (error) throw new Error(`Attendance upload error: ${error.message}`);
                    results.attendance.uploaded += batch.length;
                }
            }
        }

        // Build summary message
        const totalUploaded = results.students.uploaded + results.performance.uploaded + results.attendance.uploaded;
        const totalErrors = results.students.errors.length + results.performance.errors.length + results.attendance.errors.length;
        
        let message = `Excel file processed successfully!\n`;
        message += `- Students: ${results.students.uploaded} uploaded`;
        message += `\n- Performance: ${results.performance.uploaded} uploaded`;
        message += `\n- Attendance: ${results.attendance.uploaded} uploaded`;
        
        if (totalErrors > 0) {
            message += `\n\n${totalErrors} row(s) had errors and were skipped.`;
        }

        res.status(200).json({ 
            message,
            uploaded: totalUploaded,
            details: {
                students: results.students.uploaded,
                performance: results.performance.uploaded,
                attendance: results.attendance.uploaded
            },
            errors: {
                students: results.students.errors.slice(0, 5),
                performance: results.performance.errors.slice(0, 5),
                attendance: results.attendance.errors.slice(0, 5)
            }
        });
    } catch (err) {
        console.error('Excel upload error:', err);
        res.status(500).json({ 
            error: err.message || 'An error occurred while processing the Excel file. Please check the file format and try again.' 
        });
    }
};

// Upload CSV file with course code format (dataforinhouseCSV.csv)
export const uploadCourseCodeCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please select a file.' });
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB for large CSV files
    if (req.file.size > maxSize) {
        return res.status(400).json({ error: 'File size exceeds 50MB limit.' });
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

        // Check for required columns (case-insensitive)
        const firstRow = data[0];
        const headers = Object.keys(firstRow).map(h => h.toLowerCase().trim());
        
        const hasRegisterNo = headers.some(h => h.includes('register') && h.includes('no'));
        const hasStudentName = headers.some(h => h.includes('student') && h.includes('name'));
        const hasCourseCode = headers.some(h => h.includes('course') && h.includes('code'));
        const hasGrade = headers.some(h => h === 'grade');

        if (!hasRegisterNo || !hasStudentName || !hasCourseCode || !hasGrade) {
            return res.status(400).json({ 
                error: 'CSV file must contain: Register No, Student Name, Course Code, and Grade columns' 
            });
        }

        // Helper to get column value (case-insensitive)
        const getCol = (row, patterns) => {
            for (const key in row) {
                const lowerKey = key.toLowerCase().trim();
                for (const pattern of patterns) {
                    if (lowerKey.includes(pattern.toLowerCase())) {
                        return row[key];
                    }
                }
            }
            return null;
        };

        // Helper to convert grade to approximate marks
        const gradeToMarks = (grade) => {
            const gradeMap = {
                'O': 95,
                'A+': 87,
                'A': 75,
                'B+': 65,
                'B': 55,
                'C': 45,
                'F': 30
            };
            return gradeMap[grade?.toUpperCase().trim()] || 50;
        };

        // Extract unique students and subjects
        const studentsMap = new Map();
        const subjectsMap = new Map();
        const performanceData = [];

        data.forEach((row, index) => {
            try {
                const registerNo = getCol(row, ['register no', 'register_no', 'registration_number', 'reg_no']);
                const studentName = getCol(row, ['student name', 'student_name', 'name']);
                const courseCode = getCol(row, ['course code', 'course_code', 'code']);
                const courseTitle = getCol(row, ['course title', 'course_title', 'title']);
                const grade = getCol(row, ['grade']);

                if (!registerNo || !studentName || !courseCode || !grade) {
                    return; // Skip invalid rows
                }

                // Store unique students
                if (!studentsMap.has(registerNo)) {
                    studentsMap.set(registerNo, {
                        registration_number: String(registerNo).trim(),
                        name: String(studentName).trim(),
                        section_id: sectionId,
                        gender: 'Other', // Default since not available in this CSV
                        residence_type: 'Day Scholar' // Default since not available in this CSV
                    });
                }

                // Store unique subjects (by course code)
                if (!subjectsMap.has(courseCode)) {
                    subjectsMap.set(courseCode, {
                        code: String(courseCode).trim(),
                        name: courseTitle ? String(courseTitle).trim() : String(courseCode).trim(),
                        year: null, // Extract from code if possible (21 = 2021?)
                        department: 'Engineering' // Default, can be updated
                    });
                }

                // Store performance data
                performanceData.push({
                    register_no: String(registerNo).trim(),
                    course_code: String(courseCode).trim(),
                    grade: String(grade).trim().toUpperCase(),
                    semester: 1 // Default to 1, can be extracted from course code if needed
                });
            } catch (err) {
                console.warn(`Error processing row ${index + 2}:`, err.message);
            }
        });

        if (studentsMap.size === 0 || subjectsMap.size === 0 || performanceData.length === 0) {
            return res.status(400).json({ error: 'No valid data found in CSV file.' });
        }

        const results = {
            students: { uploaded: 0, errors: [] },
            subjects: { created: 0, errors: [] },
            performance: { uploaded: 0, errors: [] }
        };

        // Step 1: Create/update subjects
        const subjectCodeToId = new Map();
        for (const [code, subjectData] of subjectsMap.entries()) {
            try {
                // Check if subject exists
                const { data: existing, error: checkError } = await supabase
                    .from('subjects')
                    .select('id')
                    .eq('code', subjectData.code)
                    .maybeSingle();

                let subjectId;
                if (existing && !checkError) {
                    subjectId = existing.id;
                } else {
                    // Create new subject
                    const { data: newSubject, error: createError } = await supabase
                        .from('subjects')
                        .insert({
                            code: subjectData.code,
                            name: subjectData.name,
                            year: subjectData.year,
                            department: subjectData.department
                        })
                        .select('id')
                        .single();

                    if (createError) {
                        results.subjects.errors.push(`Subject ${code}: ${createError.message}`);
                        continue;
                    }
                    subjectId = newSubject.id;
                    results.subjects.created++;
                }
                subjectCodeToId.set(code, subjectId);
            } catch (err) {
                results.subjects.errors.push(`Subject ${code}: ${err.message}`);
            }
        }

        // Step 2: Create/update students
        const studentsArray = Array.from(studentsMap.values());
        const batchSize = 1000;
        for (let i = 0; i < studentsArray.length; i += batchSize) {
            const batch = studentsArray.slice(i, i + batchSize);
            const { error } = await supabase
                .from('students')
                .upsert(batch, { onConflict: 'registration_number' });
            
            if (error) {
                results.students.errors.push(`Batch ${i + 1}: ${error.message}`);
            } else {
                results.students.uploaded += batch.length;
            }
        }

        // Step 3: Create performance records
        const performanceRecords = [];
        for (const perf of performanceData) {
            const subjectId = subjectCodeToId.get(perf.course_code);
            if (!subjectId) {
                results.performance.errors.push(`Course code ${perf.course_code} not found`);
                continue;
            }

            const marks = gradeToMarks(perf.grade);
            performanceRecords.push({
                student_reg_no: perf.register_no,
                subject_id: subjectId,
                marks: marks,
                grade: perf.grade,
                semester: perf.semester
            });
        }

        // Upload performance in batches
        for (let i = 0; i < performanceRecords.length; i += batchSize) {
            const batch = performanceRecords.slice(i, i + batchSize);
            const { error } = await supabase
                .from('performance')
                .upsert(batch);
            
            if (error) {
                results.performance.errors.push(`Batch ${i + 1}: ${error.message}`);
            } else {
                results.performance.uploaded += batch.length;
            }
        }

        // Build summary
        const totalUploaded = results.students.uploaded + results.performance.uploaded;
        let message = `CSV file processed successfully!\n`;
        message += `- Students: ${results.students.uploaded} uploaded\n`;
        message += `- Subjects: ${results.subjects.created} created\n`;
        message += `- Performance Records: ${results.performance.uploaded} uploaded`;

        const totalErrors = results.students.errors.length + results.subjects.errors.length + results.performance.errors.length;
        if (totalErrors > 0) {
            message += `\n\n${totalErrors} error(s) occurred (see details below).`;
        }

        res.status(200).json({ 
            message,
            uploaded: totalUploaded,
            details: {
                students: results.students.uploaded,
                subjects: results.subjects.created,
                performance: results.performance.uploaded
            },
            errors: {
                students: results.students.errors.slice(0, 5),
                subjects: results.subjects.errors.slice(0, 5),
                performance: results.performance.errors.slice(0, 5)
            }
        });
    } catch (err) {
        console.error('CSV upload error:', err);
        res.status(500).json({ 
            error: err.message || 'An error occurred while processing the CSV file.' 
        });
    }
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
                totalRecords: 0,
                passPercentage: 0,
                failPercentage: 0,
                totalArrears: 0,
                arrearsData: [],
                hostelData: [],
                topStudents: [],
                genderDistribution: [],
                subjectAnalytics: [],
                gradeDistribution: [],
                subjectGradeDistribution: {},
                semesterDistribution: [],
                marksDistribution: []
            });
        }
        
        const regNumbers = sectionStudents.map(s => s.registration_number);
        
        // Fetch performance data for the section with subject information
        // Note: If regNumbers is empty, skip the query
        let performanceData = [];
        if (regNumbers.length > 0) {
            try {
                // Split into smaller batches if too many registration numbers (Supabase has limits)
                const batchSize = 100;
                let allPerfData = [];
                
                for (let i = 0; i < regNumbers.length; i += batchSize) {
                    const batch = regNumbers.slice(i, i + batchSize);
                    const { data: perfData, error: perfError } = await supabase
                        .from('performance')
                        .select('marks, arrear_status, student_reg_no, grade, subject_id, semester, subjects(name, code)')
                        .in('student_reg_no', batch);
                    
                    if (perfError) {
                        throw perfError;
                    }
                    if (perfData) {
                        allPerfData = allPerfData.concat(perfData);
                    }
                }
                
                performanceData = allPerfData;
            } catch (perfError) {
                // Check if it's a network error
                if (perfError.message && perfError.message.includes('fetch failed')) {
                    console.error('Network error connecting to Supabase, trying fallback...');
                    // Try without the relationship as fallback, in batches
                    try {
                        const batchSize = 100;
                        let allPerfData = [];
                        
                        for (let i = 0; i < regNumbers.length; i += batchSize) {
                            const batch = regNumbers.slice(i, i + batchSize);
                            const { data: perfDataSimple, error: perfErrorSimple } = await supabase
                                .from('performance')
                                .select('marks, arrear_status, student_reg_no, grade, subject_id, semester')
                                .in('student_reg_no', batch);
                            
                            if (perfErrorSimple) {
                                console.error(`Fallback query failed for batch ${i / batchSize + 1}:`, perfErrorSimple.message);
                                // Continue with other batches
                            } else if (perfDataSimple) {
                                allPerfData = allPerfData.concat(perfDataSimple);
                            }
                        }
                        
                        performanceData = allPerfData;
                    } catch (fallbackErr) {
                        console.error('Fallback query exception:', fallbackErr.message);
                        performanceData = [];
                    }
                } else {
                    // Regular database error, try fallback
                    console.error('Performance query error:', perfError);
                    try {
                        const batchSize = 100;
                        let allPerfData = [];
                        
                        for (let i = 0; i < regNumbers.length; i += batchSize) {
                            const batch = regNumbers.slice(i, i + batchSize);
                            const { data: perfDataSimple, error: perfErrorSimple } = await supabase
                                .from('performance')
                                .select('marks, arrear_status, student_reg_no, grade, subject_id, semester')
                                .in('student_reg_no', batch);
                            
                            if (perfErrorSimple) {
                                console.error(`Fallback query error for batch ${i / batchSize + 1}:`, perfErrorSimple);
                            } else if (perfDataSimple) {
                                allPerfData = allPerfData.concat(perfDataSimple);
                            }
                        }
                        
                        performanceData = allPerfData;
                    } catch (fallbackErr) {
                        console.error('Fallback query exception:', fallbackErr.message);
                        performanceData = [];
                    }
                }
            }
        }

        // Fetch students data with error handling
        let studentsData = [];
        try {
            const { data: studData, error: studError } = await supabase
                .from('students')
                .select('gender, residence_type')
                .eq('section_id', sectionId);
            
            if (studError) {
                if (studError.message && studError.message.includes('fetch failed')) {
                    console.error('Network error fetching students:', studError.message);
                    studentsData = [];
                } else {
                    throw studError;
                }
            } else {
                studentsData = studData || [];
            }
        } catch (networkErr) {
            console.error('Network exception fetching students:', networkErr.message);
            studentsData = [];
        }

        // Handle null/undefined values safely
        const safePerformanceData = (performanceData || []).filter(p => p != null);
        
        if (safePerformanceData.length === 0) {
            // Return proper analytics object even when no performance data
            const genderDist = (studentsData || []).reduce((acc, stud) => {
                if (stud && stud.gender) {
                    acc[stud.gender] = (acc[stud.gender] || 0) + 1;
                }
                return acc;
            }, {});

            const residenceDist = (studentsData || []).reduce((acc, stud) => {
                if (stud && stud.residence_type) {
                    acc[stud.residence_type] = (acc[stud.residence_type] || 0) + 1;
                }
                return acc;
            }, {});

            return res.status(200).json({ 
                message: 'No performance data available for this section.',
                totalStudents: sectionStudents.length,
                totalRecords: 0,
                passPercentage: 0,
                failPercentage: 0,
                totalArrears: 0,
                arrearsData: [],
                hostelData: Object.entries(residenceDist).map(([name, value]) => ({ name, value })),
                topStudents: [],
                genderDistribution: Object.entries(genderDist).map(([name, value]) => ({ name, value })),
                subjectAnalytics: [],
                gradeDistribution: [],
                subjectGradeDistribution: {},
                semesterDistribution: [],
                marksDistribution: []
            });
        }
        
        // Calculations
        const totalStudents = new Set(safePerformanceData.map(p => p.student_reg_no)).size;
        const passedCount = safePerformanceData.filter(p => p.arrear_status === false).length;
        const failedCount = safePerformanceData.filter(p => p.arrear_status === true).length;
        
        // Get student names if not in relationship
        const studentNameMap = new Map();
        if (safePerformanceData.length > 0 && (!safePerformanceData[0].students || !safePerformanceData[0].students.name)) {
            try {
                const uniqueRegNos = [...new Set(safePerformanceData.map(p => p.student_reg_no))];
                const { data: studentNames, error: nameError } = await supabase
                    .from('students')
                    .select('registration_number, name')
                    .in('registration_number', uniqueRegNos);
                
                if (!nameError && studentNames) {
                    studentNames.forEach(s => {
                        if (s && s.registration_number && s.name) {
                            studentNameMap.set(s.registration_number, s.name);
                        }
                    });
                } else if (nameError && nameError.message && nameError.message.includes('fetch failed')) {
                    console.error('Network error fetching student names:', nameError.message);
                    // Continue without names - will use 'Unknown'
                }
            } catch (nameErr) {
                console.error('Exception fetching student names:', nameErr.message);
                // Continue without names
            }
        }

        // Get subject names if not in relationship
        const subjectNameMap = new Map();
        const uniqueSubjectIds = [...new Set(safePerformanceData.map(p => p.subject_id).filter(id => id != null))];
        if (uniqueSubjectIds.length > 0 && (!safePerformanceData[0].subjects || !safePerformanceData[0].subjects.name)) {
            try {
                const { data: subjectNames, error: subjError } = await supabase
                    .from('subjects')
                    .select('id, name, code')
                    .in('id', uniqueSubjectIds);
                
                if (!subjError && subjectNames) {
                    subjectNames.forEach(s => {
                        if (s && s.id) {
                            subjectNameMap.set(s.id, s.name || s.code || `Subject ${s.id}`);
                        }
                    });
                }
            } catch (subjErr) {
                console.error('Exception fetching subject names:', subjErr.message);
            }
        }

        const studentMarks = safePerformanceData.reduce((acc, curr) => {
            // Safely access students relationship or use name map
            let studentName = 'Unknown';
            if (curr.students && curr.students.name) {
                studentName = curr.students.name;
            } else if (curr.student_reg_no && studentNameMap.has(curr.student_reg_no)) {
                studentName = studentNameMap.get(curr.student_reg_no);
            }
            const marks = curr.marks || 0;
            acc[studentName] = (acc[studentName] || 0) + marks;
            return acc;
        }, {});

        const top5Students = Object.entries(studentMarks)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, total_marks]) => ({ name, total_marks }));

        const genderDist = (studentsData || []).reduce((acc, stud) => {
            if (stud && stud.gender) {
                acc[stud.gender] = (acc[stud.gender] || 0) + 1;
            }
            return acc;
        }, {});

        const residenceDist = (studentsData || []).reduce((acc, stud) => {
            if (stud && stud.residence_type) {
                acc[stud.residence_type] = (acc[stud.residence_type] || 0) + 1;
            }
            return acc;
        }, {});

        // Subject-wise analytics
        const subjectAnalytics = {};
        const gradeDistribution = { 'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'F': 0 };
        const subjectGradeDistribution = {};
        const subjectPerformance = {};
        const semesterDistribution = {};

        safePerformanceData.forEach(perf => {
            const subjectId = perf.subject_id;
            let subjectName = `Subject ${subjectId}`;
            if (perf.subjects && perf.subjects.name) {
                subjectName = perf.subjects.name;
            } else if (perf.subjects && perf.subjects.code) {
                subjectName = perf.subjects.code;
            } else if (subjectId && subjectNameMap.has(subjectId)) {
                subjectName = subjectNameMap.get(subjectId);
            }
            const grade = perf.grade || 'F';
            const semester = perf.semester || 1;

            // Overall grade distribution
            if (gradeDistribution.hasOwnProperty(grade)) {
                gradeDistribution[grade]++;
            }

            // Subject-wise grade distribution
            if (!subjectGradeDistribution[subjectName]) {
                subjectGradeDistribution[subjectName] = { 'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'F': 0 };
            }
            if (subjectGradeDistribution[subjectName].hasOwnProperty(grade)) {
                subjectGradeDistribution[subjectName][grade]++;
            }

            // Subject performance summary
            if (!subjectPerformance[subjectName]) {
                subjectPerformance[subjectName] = {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    averageMarks: 0,
                    totalMarks: 0
                };
            }
            subjectPerformance[subjectName].total++;
            if (perf.arrear_status === false) {
                subjectPerformance[subjectName].passed++;
            } else {
                subjectPerformance[subjectName].failed++;
            }
            subjectPerformance[subjectName].totalMarks += (perf.marks || 0);

            // Semester distribution
            semesterDistribution[semester] = (semesterDistribution[semester] || 0) + 1;
        });

        // Calculate averages and format subject analytics
        const subjectAnalyticsArray = Object.entries(subjectPerformance).map(([name, data]) => ({
            name,
            total: data.total,
            passed: data.passed,
            failed: data.failed,
            passPercentage: ((data.passed / data.total) * 100).toFixed(2),
            averageMarks: (data.totalMarks / data.total).toFixed(2),
            gradeDistribution: subjectGradeDistribution[name] || {}
        })).sort((a, b) => parseFloat(b.averageMarks) - parseFloat(a.averageMarks));

        // Format grade distribution for charts
        const gradeDistributionArray = Object.entries(gradeDistribution).map(([grade, count]) => ({
            grade,
            count
        }));

        // Format semester distribution
        const semesterDistributionArray = Object.entries(semesterDistribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([semester, count]) => ({
                semester: `Semester ${semester}`,
                count
            }));

        // Marks distribution (buckets)
        const marksBuckets = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '50-59': 0, '40-49': 0, '0-39': 0 };
        safePerformanceData.forEach(perf => {
            const marks = perf.marks || 0;
            if (marks >= 90) marksBuckets['90-100']++;
            else if (marks >= 80) marksBuckets['80-89']++;
            else if (marks >= 70) marksBuckets['70-79']++;
            else if (marks >= 60) marksBuckets['60-69']++;
            else if (marks >= 50) marksBuckets['50-59']++;
            else if (marks >= 40) marksBuckets['40-49']++;
            else marksBuckets['0-39']++;
        });

        const marksDistributionArray = Object.entries(marksBuckets).map(([range, count]) => ({
            range,
            count
        }));

        // Construct comprehensive analytics object
        const analytics = {
            totalStudents,
            passPercentage: totalStudents > 0 ? ((passedCount / (passedCount + failedCount)) * 100).toFixed(2) : 0,
            failPercentage: totalStudents > 0 ? ((failedCount / (passedCount + failedCount)) * 100).toFixed(2) : 0,
            totalArrears: failedCount,
            totalRecords: safePerformanceData.length,
            // Charts data
            arrearsData: [
                { name: 'Passed', value: passedCount },
                { name: 'Failed', value: failedCount }
            ],
            hostelData: Object.entries(residenceDist).map(([name, value]) => ({ name, value })),
            topStudents: top5Students.map(s => ({ name: s.name, score: s.total_marks })),
            genderDistribution: Object.entries(genderDist).map(([name, value]) => ({ name, value })),
            // New comprehensive analytics
            subjectAnalytics: subjectAnalyticsArray,
            gradeDistribution: gradeDistributionArray,
            subjectGradeDistribution: subjectGradeDistribution,
            semesterDistribution: semesterDistributionArray,
            marksDistribution: marksDistributionArray
        };

        res.status(200).json(analytics);
    } catch (err) {
        console.error('Analytics error:', err);
        
        // Check if it's a network/connectivity error
        const isNetworkError = err.message && (
            err.message.includes('fetch failed') ||
            err.message.includes('ECONNREFUSED') ||
            err.message.includes('ENOTFOUND') ||
            err.message.includes('timeout')
        );
        
        if (isNetworkError) {
            return res.status(503).json({ 
                error: 'Unable to connect to database. Please check your internet connection and Supabase configuration.',
                message: 'Database connection failed. Please verify your Supabase credentials and network connectivity.',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        
        res.status(500).json({ 
            error: err.message || 'An error occurred while fetching analytics.',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
