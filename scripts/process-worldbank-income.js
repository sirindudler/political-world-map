const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('world-bank-income.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

// Process data and create JSON mapping
const incomeData = {};

data.forEach(row => {
  const code = row['Code'] || row['Country Code'] || row['ISO3'];
  const income = row['Income group'] || row['IncomeGroup'] || row['Income Group'];

  if (code && income && code.length === 3) {
    // Normalize income group names
    if (income.includes('High income') || income === 'High income' || income === 'HIC') {
      incomeData[code] = 'High Income';
    } else if (income.includes('Upper middle') || income === 'Upper middle income' || income === 'UMC') {
      incomeData[code] = 'Upper Middle Income';
    } else if (income.includes('Lower middle') || income === 'Lower middle income' || income === 'LMC') {
      incomeData[code] = 'Lower Middle Income';
    } else if (income.includes('Low income') || income === 'Low income' || income === 'LIC') {
      incomeData[code] = 'Low Income';
    }
  }
});

// Write to JSON file
fs.writeFileSync('public/world-bank-income-data.json', JSON.stringify(incomeData, null, 2));

console.log(`Processed ${Object.keys(incomeData).length} countries`);
console.log('Sample data:', Object.entries(incomeData).slice(0, 5));
