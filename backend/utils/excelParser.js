import XLSX from 'xlsx';

/**
 * Parse Excel file buffer and return data from specified sheets
 * @param {Buffer} buffer - Excel file buffer
 * @param {string[]} sheetNames - Array of sheet names to parse (optional, if not provided, parses all sheets)
 * @returns {Object} Object with sheet names as keys and arrays of row objects as values
 */
export const parseExcelBuffer = (buffer, sheetNames = null) => {
    try {
        if (!buffer || buffer.length === 0) {
            throw new Error('File buffer is empty');
        }

        // Parse the Excel workbook
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Excel file contains no sheets');
        }

        const result = {};
        
        // Determine which sheets to parse
        const sheetsToParse = sheetNames || workbook.SheetNames;
        
        sheetsToParse.forEach(sheetName => {
            if (!workbook.Sheets[sheetName]) {
                console.warn(`Sheet "${sheetName}" not found in Excel file`);
                return;
            }

            // Convert sheet to JSON
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                defval: '', // Default value for empty cells
                raw: false, // Convert all values to strings
            });

            // Filter out completely empty rows
            const validRows = sheetData.filter(row => {
                return Object.values(row).some(val => val && val.toString().trim() !== '');
            });

            if (validRows.length > 0) {
                result[sheetName] = validRows;
            }
        });

        if (Object.keys(result).length === 0) {
            throw new Error('Excel file contains no valid data');
        }

        return result;
    } catch (err) {
        if (err.message) {
            throw err;
        }
        throw new Error(`Excel parsing error: ${err.message || 'Unknown error'}`);
    }
};

/**
 * Parse Excel file and return data from a single sheet
 * @param {Buffer} buffer - Excel file buffer
 * @param {string} sheetName - Name of the sheet to parse (optional, defaults to first sheet)
 * @returns {Array} Array of row objects
 */
export const parseExcelSheet = (buffer, sheetName = null) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file contains no sheets');
    }

    const targetSheet = sheetName || workbook.SheetNames[0];
    
    if (!workbook.Sheets[targetSheet]) {
        throw new Error(`Sheet "${targetSheet}" not found in Excel file`);
    }

    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[targetSheet], {
        defval: '',
        raw: false,
    });

    // Filter out completely empty rows
    const validRows = sheetData.filter(row => {
        return Object.values(row).some(val => val && val.toString().trim() !== '');
    });

    if (validRows.length === 0) {
        throw new Error(`Sheet "${targetSheet}" contains no valid data`);
    }

    return validRows;
};

