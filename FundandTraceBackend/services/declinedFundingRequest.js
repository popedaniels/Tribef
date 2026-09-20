const { footer } = require("./footer");
const { header } = require("./header");
const { createTransporter } = require("./mailing");
const logger = require("../utility/logger");

exports.declinedFundingRequestMailService = async (user, request, reason) => {
  const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  };

  let mailOptions = {
    from: "fundandtrace@gmail.com",
    to: user.email,
    subject: "Funding Request Declined",
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
      Hi, ${user.firstName}. <br />
      Your funding request of ${request.amount} ${
      request.currency
    } was declined. <br />
      ${reason ? `The reason is ${reason} <br />` : ""} 
      You can find this by following this <a href=${
        process.env.MAINURL
      }/dashboard/${
      request.campaignId
    }/fundingRequest?tab=requests target="_blank">Link</a> 
  </div>
  ${footer()}
</div>
</body>

</html>`,
  };

  try {
    await sendEmail(mailOptions);
    logger.info("Declined funding request mail sent");
  } catch (err) {
    logger.error({ err }, "Declined funding request mail failed");
    throw err;
  }
};
