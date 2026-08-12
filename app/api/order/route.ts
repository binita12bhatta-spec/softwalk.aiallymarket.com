import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
type Order = { customerName: string; phone: string; email: string; location: string; deliveryArea: 'valley' | 'outside'; deliveryFee: number; productName: string; quantity: number; pricePerPiece: number; totalPrice: number };
const envKeys = ['GOOGLE_SHEET_ID', 'GOOGLE_SHEET_TAB_NAME', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'BUSINESS_EMAIL', 'EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const columns = ['Order ID', 'Date & Time', 'Customer Name', 'Phone Number', 'Email Address', 'Exact Location', 'Product Name', 'Quantity', 'Price Per Piece', 'Total Price', 'Payment Method', 'Order Status', 'Notes'];
const money = (amount: number) => `Rs ${amount.toLocaleString('en-IN')}`;

function valid(input: Partial<Order>): input is Order {
  return typeof input.customerName === 'string' && input.customerName.trim().length > 0 && typeof input.phone === 'string' && /^[0-9+\-\s]{7,20}$/.test(input.phone) && typeof input.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) && typeof input.location === 'string' && input.location.trim().length > 0 && typeof input.productName === 'string' && input.productName.trim().length > 0 && typeof input.quantity === 'number' && Number.isInteger(input.quantity) && input.quantity > 0 && typeof input.pricePerPiece === 'number' && input.pricePerPiece > 0 && typeof input.totalPrice === 'number' && input.totalPrice > 0;
}

async function setupSheet(sheets: ReturnType<typeof google.sheets>) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
  const title = process.env.GOOGLE_SHEET_TAB_NAME!;
  const info = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets(properties(sheetId,title),data.rowData.values.formattedValue)' });
  const sheet = info.data.sheets?.find((item) => item.properties?.title === title) ?? info.data.sheets?.[0];
  if (!sheet?.properties?.sheetId || !sheet.properties.title) throw new Error('No usable sheet tab was found in this spreadsheet.');
  const activeTitle = sheet.properties.title;
  if (sheet.data?.[0]?.rowData?.[0]?.values?.some((cell) => cell.formattedValue)) return activeTitle;
  const sheetId = sheet.properties.sheetId;
  await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${activeTitle.replace(/'/g, "''")}'!A1:M1`, valueInputOption: 'RAW', requestBody: { values: [columns] } });
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 13 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.145, green: 0.125, blue: 0.114 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }, horizontalAlignment: 'CENTER', wrapStrategy: 'WRAP' } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy)' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 13 }, properties: { pixelSize: 135 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 240 }, fields: 'pixelSize' } },
    { setDataValidation: { range: { sheetId, startRowIndex: 1, startColumnIndex: 11, endColumnIndex: 12 }, rule: { condition: { type: 'ONE_OF_LIST', values: ['New Order', 'Order Confirmed', 'Order Ongoing', 'Delivered', 'Cancelled'].map((value) => ({ userEnteredValue: value })) }, strict: true, showCustomUi: true } } },
    { setBasicFilter: { filter: { range: { sheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: 13 } } } }
  ] } });
  return activeTitle;
}

function emailLayout(content: string) { return `<div style="background:#f8f2e9;padding:32px 16px;font-family:Arial,sans-serif;color:#25201d"><table role="presentation" style="max-width:620px;width:100%;margin:auto;background:#fff;border-radius:20px;overflow:hidden"><tr><td style="padding:24px 32px;background:#25201d;color:#fff;font:700 25px Georgia,serif">Soft<span style="color:#f2c1aa">Walk</span></td></tr><tr><td style="padding:32px">${content}</td></tr><tr><td style="padding:18px 32px;background:#f8f2e9;color:#716963;font-size:12px">SoftWalk · Comfort in every step</td></tr></table></div>`; }
function detailRows(order: Order) { return `<table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0">Product</td><td style="text-align:right;font-weight:bold">${order.productName}</td></tr><tr><td style="padding:8px 0">Quantity</td><td style="text-align:right;font-weight:bold">${order.quantity}</td></tr><tr><td style="padding:8px 0">Total</td><td style="text-align:right;font-weight:bold">${money(order.totalPrice)}</td></tr><tr><td style="padding:8px 0">Payment</td><td style="text-align:right;font-weight:bold">Cash On Delivery</td></tr></table>`; }

export async function POST(request: NextRequest) {
  try {
    const order = await request.json() as Partial<Order>;
    if (!valid(order)) return NextResponse.json({ error: 'Please provide complete, valid order information.' }, { status: 400 });
    const missing = envKeys.filter((key) => !process.env[key]);
    if (missing.length) return NextResponse.json({ error: 'Order service is not configured yet. Please contact us to place your order.' }, { status: 503 });
    const orderId = `SW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const timestamp = new Intl.DateTimeFormat('en-NP', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kathmandu' }).format(new Date());
    const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });
    const tab = (await setupSheet(sheets)).replace(/'/g, "''");
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: `'${tab}'!A:M`, valueInputOption: 'USER_ENTERED', requestBody: { values: [[orderId, timestamp, order.customerName, order.phone, order.email, order.location, order.productName, order.quantity, order.pricePerPiece, order.totalPrice, 'Cash On Delivery', 'New Order', '']] } });
    const mailer = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await mailer.sendMail({ from: process.env.EMAIL_FROM, to: process.env.BUSINESS_EMAIL, replyTo: process.env.EMAIL_FROM, subject: `New Product Order Received - ${orderId}`, html: emailLayout(`<h1 style="font:700 30px Georgia,serif">A new order is in.</h1><p><b>Order ID:</b> ${orderId}<br><b>Received:</b> ${timestamp}</p><div style="padding:14px;background:#fff4ee;border-radius:12px;color:#8c351f"><b>Please call the customer soon to confirm this order.</b></div><h3>Customer</h3><p>${order.customerName}<br>${order.phone}<br>${order.email}<br>${order.location}</p><h3>Order details</h3>${detailRows(order)}<p><b>Status:</b> New Order</p>`) });
    await mailer.sendMail({ from: process.env.EMAIL_FROM, to: order.email, replyTo: process.env.EMAIL_FROM, subject: `Your Order Has Been Received - ${process.env.BRAND_NAME || 'SoftWalk'}`, html: emailLayout(`<h1 style="font:700 30px Georgia,serif">Thank you, ${order.customerName}!</h1><p>We have received your order successfully.</p><div style="padding:18px;background:#f8f2e9;border-radius:12px"><b>Order ID: ${orderId}</b>${detailRows(order)}</div><p>Our sales representative will call you soon to confirm your order.</p><p>Thank you,<br><b>${process.env.BRAND_NAME || 'SoftWalk'}</b></p>`) });
    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Order submission failed:', error);
    return NextResponse.json({ error: 'We could not complete your order. Please try again or contact us directly.' }, { status: 500 });
  }
}
