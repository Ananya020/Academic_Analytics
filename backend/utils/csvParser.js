
import csv from 'csv-parser';
import { Readable } from 'stream';

export const parseCsvBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        
        // Handle empty buffer
        if (!buffer || buffer.length === 0) {
            return reject(new Error('File buffer is empty'));
        }
        
        // Convert buffer to string with UTF-8 encoding
        let csvString;
        try {
            csvString = buffer.toString('utf8');
        } catch (err) {
            return reject(new Error('Failed to parse file: Invalid encoding'));
        }
        
        if (!csvString || csvString.trim().length === 0) {
            return reject(new Error('CSV file is empty'));
        }
        
        const stream = Readable.from(csvString);

        stream
            .pipe(csv({
                skipEmptyLines: true,
                skipLinesWithError: false
            }))
            .on('data', (data) => {
                // Filter out completely empty rows
                const hasData = Object.values(data).some(val => val && val.toString().trim() !== '');
                if (hasData) {
                    results.push(data);
                }
            })
            .on('end', () => {
                if (results.length === 0) {
                    return reject(new Error('CSV file contains no valid data rows'));
                }
                resolve(results);
            })
            .on('error', (error) => {
                reject(new Error(`CSV parsing error: ${error.message}`));
            });
    });
};
