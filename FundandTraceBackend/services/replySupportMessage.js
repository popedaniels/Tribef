const { footer } = require("./footer");
const { header } = require("./header");
const { createTransporter } = require("./mailing");
const logger = require("../utility/logger");

exports.replySupportMailService = async (email, subject, message) => {
  const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  };

  let mailOptions = {
    from: "fundandtrace@gmail.com",
    to: email,
    subject: "Fund&Trace Support",
    html: `<html>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>
  </title>
  <!--[if !mso]><!-- -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body style="background-color: #fafafa">
<div style="max-width:600px; width: 600px; margin: 0 auto">
${header()}
<br />
<div style="padding: 20px; font-size: 18px">
    <h4>
        RE: ${subject}
    </h4> <br/>
    ${message}
</div>
    ${footer()}
</div>

</body>

</html>`,
  };

  try {
    await sendEmail(mailOptions);
    logger.info("Support reply mail sent");
  } catch (err) {
    logger.error({ err }, "Support reply mail failed");
    throw err;
  }
};
