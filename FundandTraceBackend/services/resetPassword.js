const { createTransporter } = require("./mailing");
const logger = require("../utility/logger");

exports.resetPasswordMailService = async (email, token) => {
  const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  };

  let mailOptions = {
    from: "fundandtrace@gmail.com",
    to: email,
    subject: "Reset Password",
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
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: Trebuchet MS !important;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      font-family: Trebuchet MS !important;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
      font-family: Trebuchet MS !important;
    }
  </style>
  <!--[if mso]>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
  <!--[if lte mso 11]>
        <style type="text/css">
          .mj-outlook-group-fix { width:100% !important; }
        </style>
        <![endif]-->
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700" rel="stylesheet" type="text/css">
  <link href="https://fonts.googleapis.com/css?family=Rubik:300,400,500,600,700" rel="stylesheet" type="text/css">
  <style type="text/css">
    @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700);
    @import url("https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,800;1,900&display=swap");
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap')
  </style>
  <!--<![endif]-->
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style>
  <style type="text/css">
    @media only screen and (max-width:480px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }
  </style>
</head>

<body style="background-color: #FAFAFA;">
  <div style="background-color: #FAFAFA;">
    <!--[if mso | IE]>
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:10px 0;text-align:center;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:600px;"
            >
          <![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                  <tbody>
                    <tr>
                      <td style="vertical-align:top;padding:10px;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%">
                          <tr>
                            <td align="center" style="font-size:0px;padding:10px 15px;word-break:break-word;">
                              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                                <tbody>
                                  <tr>
                                    <td style="width:60px;">
                                      <img height="auto" src="https://res.cloudinary.com/wisdomosara/image/upload/v1620243876/logo_a50tjp.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="100" />
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td vertical-align="top" style="font-size:0px;padding-top:40px;padding-bottom:40px;word-break:break-word;">
                              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                  <tbody>
                                    <tr>
                                      <td style="background-color:white;vertical-align:top;border-radius:8px;padding-top:40px;padding-bottom:40px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%">
                                          <tr>
                                            <td align="center" style="font-size:0px;padding:10px;word-break:break-word;">
                                              <div style="font-family:Rubik, Helvetica, Arial, sans-serif;font-size:20px;font-weight:bold;line-height:1;text-align:center;color:#514949;">Verify your email address</div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align="center" style="font-size:0px;padding:10px 15px;word-break:break-word;">
                                            <div style="font-family:Rubik, Helvetica, Arial, sans-serif;font-size:13px;font-weight:normal;line-height:1;text-align:center;color:#514949;">Please follow the Link below to reset your password.</div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align="center" vertical-align="middle" style="font-size:0px;padding:10px 15px;word-break:break-word;">
                                              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                                <tr>
                                                  <td align="center" bgcolor="#6979F8" role="presentation" style="border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:#6979F8;" valign="middle">
                                                  <a href=${process.env.BACKENDURL}/api/resetPassword/VerifyUser?email=${email}&t=${token} style="display:inline-block;background:#6979F8;color:#ffffff;font-family:Rubik, Helvetica, Arial, sans-serif;font-size:16px;font-weight:normal;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:3px;" target="_blank">Reset Password</a>
                                                  </td>
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]>
            </td>
          
        </tr>
      
                  </table>
                <![endif]-->
            </td>
          </tr>
          <div class="block" style="width: 100%; margin-bottom: 50px; margin-top: 0px"> <!--[if mso | IE]>
                              <table class="block__table__ie" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%" width="600">
                                <tr>
                                  <td> <![endif]-->
                                    <table class="block__table" role="presentation" border="0" align="center" cellpadding="0" cellspacing="0" width="100%">
                                      <tr class="block__row">
                                        <td class="block__cell" width="100%" align="left" valign="top" style="padding: 20px">
                                          <div class="hr" style="margin: 0 auto; width: 100%;"> <!--[if mso | IE]>
                                            <table class="hr__table__ie" role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-right: auto; margin-left: auto; width: 100%;" width="100%" align="center">
                                              <tr>
                                                <td> <![endif]-->
                                                  <table class="hr__table" role="presentation" border="0" align="center" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
                                                    <tr class="hr__row">
                                                      <td class="hr__cell" width="100%" align="left" valign="top" style="border-top: 1px solid #9A9A9A;">&nbsp;</td>
                                                    </tr>
                                                  </table> <!--[if mso | IE]> </td>
                                              </tr>
                                            </table> <![endif]--> </div>
                                          <div class="block" style="margin: 0 auto; width: 80%;"> <!--[if mso | IE]>
                                            <table class="block__table__ie" role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-right: auto; margin-left: auto;width: 90%" width="486" align="center">
                                              <tr>
                                                <td> <![endif]-->
                                                  <table class="block__table" role="presentation" border="0" align="center" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr class="block__row">
                                                      <td class="block__cell" width="100%" align="left" valign="top">
                                                        <p class="text p" style="display: block; margin: 14px 0; color: #000000; font-size: 16px; line-height: 20px; text-align: center;">Copyright ©Fund & Trace, All rights reserved</p>
                                                        <div class="block" style="width: 100%">
                                            <!--[if mso | IE]>
                                                                  <table class="block__table__ie" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%" width="600">
                                                                    <tr>
                                                                      <td> <![endif]-->
                                            <table
                                              class="block__table"
                                              role="presentation"
                                              border="0"
                                              align="center"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                            >
                                              <tr class="block__row">
                                                <td
                                                  class="block__cell"
                                                  width="100%"
                                                  align="left"
                                                  valign="top"
                                                  style="padding: 0"
                                                >
                                                  <tr>
                                                    <td
                                                      align="center"
                                                      style="
                                                        padding: 0;
                                                        margin: 0;
                                                        font-size: 0px;
                                                      "
                                                    >
                                                      <table
                                                        class="
                                                          es-table-not-adapt es-social
                                                        "
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        role="presentation"
                                                        style="
                                                          mso-table-lspace: 0pt;
                                                          mso-table-rspace: 0pt;
                                                          border-collapse: collapse;
                                                          border-spacing: 0px;
                                                        "
                                                      >
                                                        <tr>
                                                          <td
                                                            valign="top"
                                                            align="center"
                                                            style="
                                                              padding: 0;
                                                              margin: 0;
                                                              padding-right: 10px;
                                                            "
                                                          >
                                                            <a
                                                              target="_blank"
                                                              href="https://facebook.com/fundandtrace"
                                                              style="
                                                                -webkit-text-size-adjust: none;
                                                                -ms-text-size-adjust: none;
                                                                mso-line-height-rule: exactly;
                                                                text-decoration: underline;
                                                                color: #2cb543;
                                                                font-size: 14px;
                                                              "
                                                              ><img
                                                                title="Facebook"
                                                                src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/facebook-logo-gray.png"
                                                                alt="Fb"
                                                                width="32"
                                                                height="32"
                                                                style="
                                                                  display: block;
                                                                  border: 0;
                                                                  outline: none;
                                                                  text-decoration: none;
                                                                  -ms-interpolation-mode: bicubic;
                                                                "
                                                            /></a>
                                                          </td>
                                                          <td
                                                            valign="top"
                                                            align="center"
                                                            style="
                                                              padding: 0;
                                                              margin: 0;
                                                              padding-right: 10px;
                                                            "
                                                          >
                                                            <a
                                                              target="_blank"
                                                              href="https://twitter.com/fundandtrace"
                                                              style="
                                                                -webkit-text-size-adjust: none;
                                                                -ms-text-size-adjust: none;
                                                                mso-line-height-rule: exactly;
                                                                text-decoration: underline;
                                                                color: #2cb543;
                                                                font-size: 14px;
                                                              "
                                                              ><img
                                                                title="Twitter"
                                                                src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/twitter-logo-gray.png"
                                                                alt="Tw"
                                                                width="32"
                                                                height="32"
                                                                style="
                                                                  display: block;
                                                                  border: 0;
                                                                  outline: none;
                                                                  text-decoration: none;
                                                                  -ms-interpolation-mode: bicubic;
                                                                "
                                                            /></a>
                                                          </td>
                                                          <td
                                                            valign="top"
                                                            align="center"
                                                            style="
                                                              padding: 0;
                                                              margin: 0;
                                                              padding-right: 10px;
                                                            "
                                                          >
                                                            <a
                                                              target="_blank"
                                                              href="https://instagram.com/fundandtrace"
                                                              style="
                                                                -webkit-text-size-adjust: none;
                                                                -ms-text-size-adjust: none;
                                                                mso-line-height-rule: exactly;
                                                                text-decoration: underline;
                                                                color: #2cb543;
                                                                font-size: 14px;
                                                              "
                                                              ><img
                                                                title="Instagram"
                                                                src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/instagram-logo-gray.png"
                                                                alt="Inst"
                                                                width="32"
                                                                height="32"
                                                                style="
                                                                  display: block;
                                                                  border: 0;
                                                                  outline: none;
                                                                  text-decoration: none;
                                                                  -ms-interpolation-mode: bicubic;
                                                                "
                                                            /></a>
                                                          </td>
                                                          <td
                                                            valign="top"
                                                            align="center"
                                                            style="
                                                              padding: 0;
                                                              margin: 0;
                                                            "
                                                          >
                                                            <a
                                                              target="_blank"
                                                              href="https://youtube.com/fundandtrace"
                                                              style="
                                                                -webkit-text-size-adjust: none;
                                                                -ms-text-size-adjust: none;
                                                                mso-line-height-rule: exactly;
                                                                text-decoration: underline;
                                                                color: #2cb543;
                                                                font-size: 14px;
                                                              "
                                                              ><img
                                                                title="Youtube"
                                                                src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/youtube-logo-gray.png"
                                                                alt="Yt"
                                                                width="32"
                                                                height="32"
                                                                style="
                                                                  display: block;
                                                                  border: 0;
                                                                  outline: none;
                                                                  text-decoration: none;
                                                                  -ms-interpolation-mode: bicubic;
                                                                "
                                                            /></a>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </td>
                                              </tr>
                                            </table>
                                            <!--[if mso | IE]> </td>
                                                                    </tr>
                                                                  </table> <![endif]-->
                                          </div>
                                                        <p class="text p" style="display: block; margin: 14px 0; color: #000000; font-size: 16px; line-height: 20px; text-align: center;">Our mailing address is:</p>
                                                        <p class="text p" style="display: block; margin: 14px 0; color: #000000; font-size: 16px; line-height: 20px; text-align: center;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ullamcorper at tempus commodo</p>
                                                      </td>
                                                    </tr>
                                                  </table> <!--[if mso | IE]> </td>
                                              </tr>
                                            </table> <![endif]--> </div>
                                        </td>
                                      </tr>
                                    </table> <!--[if mso | IE]> </td>
                                </tr>
                              </table> <![endif]--> </div>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      <![endif]-->
  </div>
</body>

</html>`,
  };

  try {
    await sendEmail(mailOptions);
    logger.info("Reset password mail sent");
  } catch (err) {
    logger.error({ err }, "Reset password mail failed");
    throw err;
  }
};

