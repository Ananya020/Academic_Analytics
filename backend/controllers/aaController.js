
import { supabase } from '../config/supabaseClient.js';

// Get sections supervised by the logged-in AA
export const getAaSections = async (req, res) => {
    const advisorId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('sections')
            .select('id, name, year, department')
            .eq('advisor_id', advisorId); // Fixed: was supervisor_id, should be advisor_id
        
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get analytics for sections supervised by the AA
export const getAaAnalytics = async (req, res) => {
    const advisorId = req.user.id;
    const { mode, section } = req.query; // 'section' for comparison, 'overall' for aggregate

    try {
        // Get sections assigned to this AA
        const { data: sections, error: sectionsError } = await supabase
            .from('sections')
            .select('id, name')
            .eq('advisor_id', advisorId); // Fixed: was supervisor_id
        if (sectionsError) throw sectionsError;

        if (!sections || sections.length === 0) {
            return res.status(200).json({ 
                message: 'No sections assigned to this advisor.',
                totalStudents: 0,
                passPercentage: 0,
                failPercentage: 0,
                totalArrears: 0,
                arrearsComparison: [],
                genderDistribution: [],
                weakSubjects: []
            });
        }
        
        const sectionIds = sections.map(s => s.id);
        
        // Get all students in these sections
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('registration_number, section_id, gender')
            .in('section_id', sectionIds);
        
        if (studentsError) throw studentsError;
        
        if (!students || students.length === 0) {
            return res.status(200).json({ 
                message: 'No students found in assigned sections.',
                totalStudents: 0,
                passPercentage: 0,
                failPercentage: 0,
                totalArrears: 0,
                arrearsComparison: [],
                genderDistribution: [],
                weakSubjects: []
            });
        }
        
        const studentRegNos = students.map(s => s.registration_number);
        
        // Get performance data for these students
        const { data: performance, error: perfError } = await supabase
            .from('performance')
            .select('marks, arrear_status, student_reg_no, subject_id, subjects(name)')
            .in('student_reg_no', studentRegNos);
        
        if (perfError) throw perfError;

        if (!performance || performance.length === 0) {
            return res.status(200).json({ 
                message: 'No performance data available.',
                totalStudents: students.length,
                passPercentage: 0,
                failPercentage: 0,
                totalArrears: 0,
                arrearsComparison: [],
                genderDistribution: [],
                weakSubjects: []
            });
        }

        // Calculate overall statistics
        const totalStudents = new Set(performance.map(p => p.student_reg_no)).size;
        const passedCount = performance.filter(p => !p.arrear_status).length;
        const failedCount = performance.filter(p => p.arrear_status).length;
        const totalEntries = performance.length;
        const passPercentage = totalEntries > 0 ? ((passedCount / totalEntries) * 100).toFixed(2) : 0;
        const failPercentage = totalEntries > 0 ? ((failedCount / totalEntries) * 100).toFixed(2) : 0;

        // Build section-wise comparison
        const sectionMap = {};
        sections.forEach(s => {
            sectionMap[s.id] = s.name;
        });
        
        const studentSectionMap = {};
        students.forEach(s => {
            studentSectionMap[s.registration_number] = s.section_id;
        });

        const sectionAnalytics = {};
        performance.forEach(p => {
            const sectionId = studentSectionMap[p.student_reg_no];
            const sectionName = sectionMap[sectionId] || 'Unknown';
            
            if (!sectionAnalytics[sectionName]) {
                sectionAnalytics[sectionName] = { pass: 0, fail: 0, total: 0 };
            }
            
            if (p.arrear_status) {
                sectionAnalytics[sectionName].fail++;
            } else {
                sectionAnalytics[sectionName].pass++;
            }
            sectionAnalytics[sectionName].total++;
        });

        const arrearsComparison = Object.entries(sectionAnalytics).map(([name, stats]) => ({
            name,
            arrears: stats.fail,
            passed: stats.pass,
            total: stats.total
        }));

        // Gender distribution
        const genderDist = students.reduce((acc, s) => {
            const gender = s.gender || 'Other';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {});

        const genderDistribution = Object.entries(genderDist).map(([name, value]) => ({
            name,
            male: name === 'Male' ? value : 0,
            female: name === 'Female' ? value : 0,
            other: name === 'Other' ? value : 0
        }));

        // Weak subjects (average marks < 40)
        const subjectStats = {};
        performance.forEach(p => {
            const subjectName = p.subjects?.name || 'Unknown';
            if (!subjectStats[subjectName]) {
                subjectStats[subjectName] = { totalMarks: 0, count: 0 };
            }
            subjectStats[subjectName].totalMarks += p.marks || 0;
            subjectStats[subjectName].count++;
        });

        const weakSubjects = Object.entries(subjectStats)
            .map(([subject, stats]) => ({
                subject,
                average: (stats.totalMarks / stats.count).toFixed(2),
                count: stats.count
            }))
            .filter(s => parseFloat(s.average) < 40)
            .sort((a, b) => parseFloat(a.average) - parseFloat(b.average));

        // Return consistent format matching frontend expectations
        res.status(200).json({
            totalStudents,
            passPercentage,
            failPercentage,
            totalArrears: failedCount,
            arrearsComparison,
            genderDistribution,
            weakSubjects
        });

    } catch (err) {
        console.error('AA Analytics Error:', err);
        res.status(500).json({ error: err.message });
    }
};
