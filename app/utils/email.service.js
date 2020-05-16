import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import utils from './index';
import systemEmails from '../models/systemEmails.model';
import config from '../config';

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: config.SMTP.host,
  port: config.SMTP.port,
  secure: config.SMTP.port.toString() === '465',
  // secure:true for port 465, secure:false for port 587
  auth: {
    user: config.SMTP.auth.user,
    pass: config.SMTP.auth.pass,
  },
});

export default async function EmailService(to, mailCode, variables) {
  try {
    const template = await systemEmails.findOne({ code: mailCode });
    if (!template) {
      const err = new Error('Template not found.');
      err.status = 401;
      throw err;
    }

    //  get mail content

    let temp = utils.unescape(template.message);
    variables.forEach(async element => {
      const reg = new RegExp(`#${element.item}#`, 'g');
      temp = temp.replace(reg, element.value);
    });
    temp = temp.toString();
    const file = `${path.join(__dirname, '../views')}/mail-template.ejs`;

    const fileContent = await fs.readFileSync(file, 'utf8').toString();
    const templates = ejs.compile(fileContent, 'utf8');
    const content = {
      company_name: variables[0].company_name,
      logo: variables[0].logo,
      site_url: variables[0].site_url,
      twitter_logo: utils.unescape(`${variables[0].company_name}${config.twitterlogo}`),
      content: utils.unescape(temp),
      copyright_text: `Copyrights ${new Date().getFullYear()}`,
      facebook_logo: utils.unescape(`${variables[0].site_url}${config.facebooklogo}`),
    };
    // setup email data with unicode symbols
    const mailOptions = {
      from: utils.unescape(template.fromEmail), // sender addres  s
      to, // list of receivers
      subject: utils.unescape(template.subject), // Subject line
      html: templates(content), // html body
    };
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    err.status = 401;
    throw new Error(err);
  }
}
