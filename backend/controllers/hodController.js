
import { supabase } from '../config/supabaseClient.js';

// Get analytics for the HOD's department
export const getHodAnalytics = async (req, res) => {
    const department = req.user.department;
    if (!department) {
        return res.status(400).json({ error: 'HOD is not assigned to a department.' });
    }

    try {
        const { data: sections, error: sectionsError } = await supabase
            .from('sections')
            .select('id')
            .eq('department', department);
        if (sectionsError) throw sectionsError;

        const sectionIds = sections.map(s => s.id);

        if (sectionIds.length === 0) {
            return res.status(404).json({ message: 'No sections found for this department.' });
        }
        
        // This is a simplified aggregation. A real-world scenario might use more complex SQL functions or views.
        const { data: performance, error: perfError } = await supabase
            .from('performance')
            .select('marks, arrear_status, subjects(name)')
            .in('student_reg_no', (
                supabase.from('students').select('registration_number').in('section_id', sectionIds)
            ).data?.map(s => s.registration_number) || []);

        if (perfError) throw perfError;

        const passCount = performance.filter(p => !p.arrear_status).length;
        const failCount = performance.filter(p => p.arrear_status).length;
        const totalEntries = performance.length;
        
        const subjectPerformance = performance.reduce((acc, p) => {
            const subjectName = p.subjects.name;
            if (!acc[subjectName]) acc[subjectName] = { pass: 0, fail: 0 };
            p.arrear_status ? acc[subjectName].fail++ : acc[subjectName].pass++;
            return acc;
        }, {});
        
        const analytics = {
            summary: {
                department,
                totalSections: sectionIds.length,
                passPercentage: totalEntries > 0 ? (passCount / totalEntries) * 100 : 0,
                failPercentage: totalEntries > 0 ? (failCount / totalEntries) * 100 : 0,
                totalArrears: failCount,
            },
            subjectWisePerformance: Object.entries(subjectPerformance).map(([subject, stats]) => ({
                subject,
                passRate: (stats.pass / (stats.pass + stats.fail)) * 100
            }))
        };
        
        res.status(200).json(analytics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Export analytics data (PDF/Excel)
export const exportHodAnalytics = async (req, res) => {
    const { format } = req.query; // 'pdf' or 'excel'
    // This is a placeholder for the export logic.
    // Implementing PDF/Excel generation requires dedicated libraries like 'pdfkit' or 'exceljs'
    // and would involve fetching the data similar to getHodAnalytics and then formatting it.
    
    if (format === 'pdf' || format === 'excel') {
        res.status(501).json({ message: `Export to ${format} is not implemented yet.` });
    } else {
        res.status(400).json({ error: 'Invalid or missing format specified. Use "pdf" or "excel".' });
    }
};
