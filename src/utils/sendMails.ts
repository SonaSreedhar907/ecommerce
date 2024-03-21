const nodemailer = require("nodemailer");
const moment = require("moment");

export const sendMail = async (
  email: string,
  subject: string,
  text: string,
  totalAmount: number,
  subtotalValues: string,
  deliveryDate: Date,
  html: string 
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: `${subject}`,
      text: `${text}`,
      totalAmount: `${totalAmount}`,
      subtotal: `${subtotalValues}`, 
      deliveryDate: moment(deliveryDate).format("MMMM Do YYYY"), 
      html: html, 
    };

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions); 
    console.log(`Mail has been sent to ${email} by send mail service.`);
  } catch (error) {
    console.error("Error while sending mail:", error);
  }
};
