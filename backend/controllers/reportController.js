import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// Helper to escape CSV cell values
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return str;
};

// @desc    Export Customers list (CSV, Excel, PDF)
// @route   GET /api/reports/customers/export
// @access  Private (Admin Only)
export const exportCustomersReport = async (req, res) => {
  try {
    const { format } = req.query; // 'csv', 'excel', 'pdf'
    const customers = await User.find({ role: 'customer' }).sort({ customerId: 1 });

    const reportData = customers.map(c => ({
      'Customer ID': c.customerId,
      'Name': c.name,
      'Mobile': c.mobile,
      'Email': c.email,
      'City': c.city || 'N/A',
      'Total Gold 22K (g)': c.totalGold22k || 0,
      'Total Gold 24K (g)': c.totalGold24k || 0,
      'Total Gold (g)': c.totalGold || 0,
      'Total Money Invested (₹)': c.totalMoneyInvested || 0,
      'Estimated Value (₹)': c.balance,
      'Pending Amount (₹)': c.pendingAmount,
      'Status': c.status,
      'Joining Date': c.joiningDate ? new Date(c.joiningDate).toLocaleDateString('en-IN') : 'N/A'
    }));

    if (format === 'csv') {
      const headers = Object.keys(reportData[0] || {});
      let csvContent = headers.join(',') + '\n';
      reportData.forEach(row => {
        csvContent += headers.map(h => escapeCSV(row[h])).join(',') + '\n';
      });

      res.setHeader('Content-Disposition', 'attachment; filename="customers_report.csv"');
      res.type('text/csv');
      return res.send(Buffer.from(csvContent, 'utf-8'));
    } 
    
    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="customers_report.xlsx"');
      res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } 
    
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Disposition', 'attachment; filename="customers_report.pdf"');
      res.type('application/pdf');
      doc.pipe(res);

      // PDF Styling & Branding
      doc.fillColor('#1a1a1a').fontSize(22).text('GANESH JEWELLERS', { align: 'center', wordSpacing: 2 });
      doc.fillColor('#AA771C').fontSize(12).text('SAVE GOLD LEDGER SCHEME', { align: 'center' });
      doc.moveDown(1);
      
      doc.fillColor('#333333').fontSize(14).text('CUSTOMER LEDGER LIST REPORT', { underline: true });
      doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleDateString('en-IN')}`);
      doc.moveDown(2);

      // Draw Grid Headers
      const colX = [30, 90, 200, 310, 390, 480, 540];
      const headers = ['Cust ID', 'Customer Name', 'Mobile', 'Email', 'Balance (₹)', 'Status'];
      
      doc.fillColor('#AA771C').fontSize(10);
      headers.forEach((h, index) => {
        doc.text(h, colX[index], doc.y, { lineBreak: false });
      });
      doc.moveDown(0.5);
      
      const currentY = doc.y;
      doc.moveTo(30, currentY).lineTo(560, currentY).strokeColor('#e5c07b').lineWidth(1.5).stroke();
      doc.moveDown(0.5);

      // Draw Rows
      doc.fillColor('#444444').fontSize(9);
      customers.forEach((c) => {
        // Page break safety
        if (doc.y > 750) {
          doc.addPage();
          // Redraw headers on new page
          doc.fillColor('#AA771C').fontSize(10);
          headers.forEach((h, index) => {
            doc.text(h, colX[index], 30, { lineBreak: false });
          });
          doc.moveTo(30, 45).lineTo(560, 45).strokeColor('#e5c07b').lineWidth(1.5).stroke();
          doc.y = 55;
          doc.fillColor('#444444').fontSize(9);
        }

        const initialY = doc.y;
        doc.text(c.customerId, colX[0], initialY);
        doc.text(c.name.substring(0, 20), colX[1], initialY);
        doc.text(c.mobile, colX[2], initialY);
        doc.text(c.email.substring(0, 18), colX[3], initialY);
        doc.text(`₹${c.balance}`, colX[4], initialY);
        doc.text(c.status, colX[5], initialY);
        doc.moveDown(0.8);
      });

      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid format requested. Support format: csv, excel, pdf.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Transactions list (CSV, Excel, PDF)
// @route   GET /api/reports/transactions/export
// @access  Private (Admin Only)
export const exportTransactionsReport = async (req, res) => {
  try {
    const { format, type, status, paymentMethod, startDate, endDate } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    const reportData = transactions.map(t => ({
      'Txn Number': t.transactionNumber,
      'Customer Name': t.customerName,
      'Amount (₹)': t.amount,
      'Gold Karat': t.goldKarat || '24K',
      'Gold Price (₹/g)': t.goldPrice || 0,
      'Gold Quantity (g)': t.goldPurchased || 0,
      'Type': t.type,
      'Method': t.paymentMethod,
      'Bank Ref ID': t.transactionId || 'N/A',
      'Date': t.date,
      'Time': t.time,
      'Remarks': t.remarks || '',
      'Created By': t.createdBy,
      'Invoice #': t.invoiceNumber || 'N/A'
    }));

    if (format === 'csv') {
      const headers = Object.keys(reportData[0] || {});
      let csvContent = headers.join(',') + '\n';
      reportData.forEach(row => {
        csvContent += headers.map(h => escapeCSV(row[h])).join(',') + '\n';
      });

      res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.csv"');
      res.type('text/csv');
      return res.send(Buffer.from(csvContent, 'utf-8'));
    } 
    
    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.xlsx"');
      res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } 
    
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.pdf"');
      res.type('application/pdf');
      doc.pipe(res);

      // PDF Styling & Branding
      doc.fillColor('#1a1a1a').fontSize(24).text('GANESH JEWELLERS', { align: 'center', wordSpacing: 2 });
      doc.fillColor('#AA771C').fontSize(12).text('SAVE GOLD LEDGER SCHEME', { align: 'center' });
      doc.moveDown(1);
      
      doc.fillColor('#333333').fontSize(14).text('TRANSACTION LEDGER HISTORY REPORT', { underline: true });
      doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleDateString('en-IN')}`);
      doc.moveDown(2);

      // Draw Grid Headers (Landscape has ~800 width)
      const colX = [30, 110, 220, 300, 380, 480, 580, 680, 750];
      const headers = ['Txn Number', 'Customer Name', 'Amount (₹)', 'Type', 'Method', 'Bank ID', 'Date', 'Invoice #'];
      
      doc.fillColor('#AA771C').fontSize(10);
      headers.forEach((h, index) => {
        doc.text(h, colX[index], doc.y, { lineBreak: false });
      });
      doc.moveDown(0.5);
      
      const currentY = doc.y;
      doc.moveTo(30, currentY).lineTo(800, currentY).strokeColor('#e5c07b').lineWidth(1.5).stroke();
      doc.moveDown(0.5);

      // Draw Rows
      doc.fillColor('#444444').fontSize(9);
      transactions.forEach((t) => {
        if (doc.y > 500) { // Landscape height is 595
          doc.addPage();
          // Redraw headers on new page
          doc.fillColor('#AA771C').fontSize(10);
          headers.forEach((h, index) => {
            doc.text(h, colX[index], 30, { lineBreak: false });
          });
          doc.moveTo(30, 45).lineTo(800, 45).strokeColor('#e5c07b').lineWidth(1.5).stroke();
          doc.y = 55;
          doc.fillColor('#444444').fontSize(9);
        }

        const initialY = doc.y;
        doc.text(t.transactionNumber, colX[0], initialY);
        doc.text(t.customerName.substring(0, 18), colX[1], initialY);
        doc.text(`₹${t.amount}`, colX[2], initialY);
        doc.text(t.type, colX[3], initialY);
        doc.text(t.paymentMethod, colX[4], initialY);
        doc.text((t.transactionId || 'N/A').substring(0, 15), colX[5], initialY);
        doc.text(t.date, colX[6], initialY);
        doc.text(t.invoiceNumber || 'N/A', colX[7], initialY);
        doc.moveDown(0.8);
      });

      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid format requested. Support format: csv, excel, pdf.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
