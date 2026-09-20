const { getCurrency } = require("../utility/converter");
const { createTransporter } = require("./mailing");
const logger = require("../utility/logger");

exports.fundingSummaryMailService = async (
  user,
  requests,
  campaign,
  campaigns,
  totalDisbursed
) => {
  const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  };

  let mailOptions = {
    from: "fundandtrace@gmail.com",
    to: user,
    subject: "Funding Summary",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>Funding Summary</title>
    <!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]-->
    <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
    <!--[if gte mso 9]>
    <xml>
    <o:OfficeDocumentSettings>
    <o:AllowPNG></o:AllowPNG>
    <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
    <!--<![endif]-->
    <style type="text/css">
    #outlook a {
    padding:0;
    }
    .es-button {
    mso-style-priority:100!important;
    text-decoration:none!important;
    }
    a[x-apple-data-detectors] {
    color:inherit!important;
    text-decoration:none!important;
    font-size:inherit!important;
    font-family:inherit!important;
    font-weight:inherit!important;
    line-height:inherit!important;
    }
    .es-desk-hidden {
    display:none;
    float:left;
    overflow:hidden;
    width:0;
    max-height:0;
    line-height:0;
    mso-hide:all;
    }
    [data-ogsb] .es-button {
    border-width:0!important;
    padding:10px 20px 10px 20px!important;
    }
    [data-ogsb] .es-button.es-button-1 {
    padding:15px 20px!important;
    }
    @media only screen and (max-width:600px), screen and (max-device-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:16px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button, button.es-button { font-size:20px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-m-margin { padding-left:10px!important; padding-right:10px!important; padding-top:10px!important; padding-bottom:10px!important } }
    </style>
    </head>
    <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0; background-color:#FAFAFA">
    <div class="es-wrapper-color" style="background-color:#FAFAFA">
    <!--[if gte mso 9]>
    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
    <v:fill type="tile" color="#fAFAFA"></v:fill>
    </v:background>
    <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
    <tr>
    <td class="es-m-margin" valign="top" style="padding:0;Margin:0">
    <table class="es-header" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA; padding-top: 20px">
    <table class="es-header-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:580px">
    <tr>
    <td class="es-m-p40r es-m-p40l" align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px">
    <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td class="es-m-p0r" valign="top" align="center" style="padding:0;Margin:0;width:540px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" class="es-m-p30r es-m-p40l" style="Margin:0;padding-right:5px;padding-top:10px;padding-bottom:10px;padding-left:10px;font-size:0px"><a target="_blank" href=${
      process.env.MAINURL
    } style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img src="https://res.cloudinary.com/wisdomosara/image/upload/v1620243876/logo_a50tjp.png" alt="fundnadtrace logo" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" height="56" title="fundnadtrace logo" width="74"></a></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <table class="es-footer" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA">
    <table class="es-footer-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:580px">
    <tr>
    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px">
    <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td valign="top" align="center" style="padding:0;Margin:0;width:540px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" class="es-m-p10r es-m-p10l" style="padding:0;Margin:0;padding-left:40px;padding-right:40px"><h2 style="Margin:0;line-height:27px;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:18px;font-style:normal;font-weight:normal;color:#333333;text-align:center"><strong>Between January 1st to 7th 2021, we have disbursed ${getCurrency(
      requests[0].currency
    )}${totalDisbursed} to the "${
      campaign.basicInformation.campaignTitle
    }" campaign</strong></h2></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-top:15px;padding-bottom:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">Below is the breakdown of expenses and disbursements:</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table>
    ${requests.map(
      (request) => `<!--  One summary Start  -->
    <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA">
    <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;border-top:1px solid #999999;border-right:1px solid #999999;border-left:1px solid #999999;width:580px;border-bottom:1px solid #999999; margin-bottom: 15px">
    <tr>
    <td class="esdev-adapt-off" align="left" style="padding:0;Margin:0;padding-bottom:15px;padding-left:15px;padding-right:15px">
    <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:550px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-top:20px;padding-bottom:25px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#333333;font-size:14px">Funding statement of ${
      campaign.basicInformation.campaignTitle
    } as at ${new Date(
        request.disbursement.dateDisbursed
      ).toDateString()}</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td class="esdev-adapt-off es-m-p10r es-m-p10l" align="left" style="padding:0;Margin:0;padding-bottom:15px;padding-left:40px;padding-right:40px">
    <table cellpadding="0" cellspacing="0" class="esdev-mso-table" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px">
    <tr>
    <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
    <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:215px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">Transaction Date</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    <td style="padding:0;Margin:0;width:20px"></td>
    <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
    <table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:265px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">${new Date(
      request.disbursement.dateDisbursed
    ).toDateString()}</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td class="esdev-adapt-off es-m-p10r es-m-p10l" align="left" style="padding:0;Margin:0;padding-bottom:15px;padding-left:40px;padding-right:40px">
    <table cellpadding="0" cellspacing="0" class="esdev-mso-table" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px">
    <tr>
    <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
    <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:215px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">Account Number</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    <td style="padding:0;Margin:0;width:20px"></td>
    <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
    <table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:265px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">${request.disbursement.accountNumber.substring(
      0,
      4
    )}xxx${request.disbursement.accountNumber.substring(7)}</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td class="esdev-adapt-off es-m-p10r es-m-p10l" align="left" style="padding:0;Margin:0;padding-bottom:15px;padding-left:40px;padding-right:40px">
    <table cellpadding="0" cellspacing="0" class="esdev-mso-table" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px">
    <tr>
    <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
    <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:215px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">Amount</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    <td style="padding:0;Margin:0;width:20px"></td>
    <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
    <table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:265px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">${
      request.disbursement.currency
    }${request.disbursement.amount}</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td class="es-m-p10r es-m-p10l" align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-left:40px;padding-right:40px">
    <!--[if mso]><table style="width:500px" cellpadding="0" cellspacing="0"><tr><td style="width:215px" valign="top"><![endif]-->
    <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
    <tr>
    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:215px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#666666;font-size:14px">Purpose of funding</p></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!--[if mso]></td><td style="width:20px"></td><td style="width:265px" valign="top"><![endif]-->
    <table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:265px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">${
      request.purposeOfFunding
    }</p></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]--></td>
    </tr>
    <tr>
    <td class="es-m-p10r es-m-p10l" align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-left:40px;padding-right:40px">
    <!--[if mso]><table style="width:500px" cellpadding="0" cellspacing="0"><tr><td style="width:215px" valign="top"><![endif]-->
    <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
    <tr>
    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:215px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#666666;font-size:14px">Proof of Payment</p></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!--[if mso]></td><td style="width:20px"></td><td style="width:265px" valign="top"><![endif]-->
    <table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:265px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src=${
      request.proofOfFunding
    } alt="proof of funding" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="265" height="176"></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]--></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!-- one sumaary ends   -->`
    )}
    <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA">
    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:580px">
    <tr>
    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" valign="top" style="padding:0;Margin:0;width:540px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" class="es-m-p10r es-m-p10l" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:40px;padding-right:40px"><h3 style="Margin:0;line-height:22px;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:18px;font-style:normal;font-weight:normal;color:#333333"><strong>Sign up on our platform to get more features on updates!</strong></h3></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="left" style="Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;padding-bottom:40px">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" valign="top" style="padding:0;Margin:0;width:540px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" class="es-m-p0r" style="padding:0;Margin:0;padding-right:5px"><span class="es-button-border" style="border-style:solid;border-color:#6979f8;background:#6979f8;border-width:0px;display:block;border-radius:5px;width:auto"><a href=${
      process.env.MAINURL
    }/SignUp class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;border-style:solid;border-color:#6979f8;border-width:10px 20px 10px 20px;display:block;background:#6979f8;border-radius:5px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;border-left-width:20px;border-right-width:20px">Sign Up</a></span></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="left" style="Margin:0;padding-bottom:10px;padding-top:20px;padding-left:20px;padding-right:20px">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" valign="top" style="padding:0;Margin:0;width:540px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;color:#333333;font-size:18px"><strong>You may also be interested in:</strong></p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
      
    <!--  row starts campaigns  -->
    <tr>
    <td class="es-m-p10r es-m-p10l" align="left" style="padding:20px;Margin:0">
    <!--[if mso]><table style="width:540px" cellpadding="0" cellspacing="0"><tr><td style="width:260px" valign="top"><![endif]-->
    <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
    <tr>
    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:260px">
    <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-left:1px solid #cccccc;border-right:1px solid #cccccc;border-top:1px solid #cccccc;border-bottom:1px solid #cccccc;border-radius:3px" role="presentation">
    <tr>
    <td align="center" style="padding:0;Margin:0"><a target="_blank" href=${
      process.env.MAINURL
    }/campaign/${
      campaigns[0]._id
    } style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img class="adapt-img" src=${
      campaigns[0].basicInformation.campaignImage
    } alt=${
      campaigns[0].basicInformation.campaignTitle
    } style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="260" title=${
      campaigns[0].basicInformation.campaignTitle
    } height="171"></a></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="Margin:0;padding-bottom:5px;padding-top:10px;padding-right:10px;padding-left:15px"><h3 class="name" style="Margin:0;line-height:20px;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:16px;font-style:normal;font-weight:normal;color:#333333">${
      campaigns[0].basicInformation.campaignTitle
    }</h3></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="Margin:0;padding-top:5px;padding-left:15px;padding-right:15px;padding-bottom:20px"><p class="title2" style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:14px;color:#666666;font-size:12px">${campaigns[0].basicInformation.campaignTagline.substring(
      0,
      60
    )}${
      campaigns[0].basicInformation.campaignTagline.length > 60 ? "..." : ""
    }/p></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-left:15px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#333333;font-size:14px">${
      campaigns[0].category
    }</p></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="padding:0;Margin:0;padding-left:15px;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#333333;font-size:14px"><span style="font-size:16px"><strong>${getCurrency(
      campaigns[0].funding.currency
    )}${
      campaigns[0].funding.amountRaised
    }</strong></span><span style="font-size:16px">&nbsp;<span style="color:#A9A9A9">raised of ${getCurrency(
      campaigns[0].funding.currency
    )}${campaigns[0].funding.amountExpected}</span></span></p></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!--[if mso]></td><td style="width:20px"></td><td style="width:260px" valign="top"><![endif]-->
    ${
      campaigns.length > 1 &&
      `<table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
    <tr>
    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:260px">
    <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-left:1px solid #cccccc;border-right:1px solid #cccccc;border-top:1px solid #cccccc;border-bottom:1px solid #cccccc;border-radius:3px" role="presentation">
    <tr>
    <td align="center" style="padding:0;Margin:0"><a target="_blank" href=${
      process.env.MAINURL
    }/campaign/${
        campaigns[1]._id
      } style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img class="adapt-img" src=${
        campaigns[1].basicInformation.campaignImage
      } alt=${
        campaigns[1].basicInformation.campaignTitle
      } style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="260" title=${
        campaigns[1].basicInformation.campaignTitle
      } height="171"></a></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="Margin:0;padding-bottom:5px;padding-top:10px;padding-right:10px;padding-left:15px"><h3 class="name" style="Margin:0;line-height:20px;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:16px;font-style:normal;font-weight:normal;color:#333333">${
      campaigns[1].basicInformation.campaignTitle
    }</h3></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="Margin:0;padding-top:5px;padding-left:15px;padding-right:15px;padding-bottom:20px"><p class="title2" style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:14px;color:#666666;font-size:12px">${campaigns[1].basicInformation.campaignTagline.substring(
      0,
      60
    )}${
        campaigns[1].basicInformation.campaignTagline.length > 60 ? "..." : ""
      }/p></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-left:15px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#333333;font-size:14px">${
      campaigns[1].category
    }</p></td>
    </tr>
    <tr>
    <td class="es-m-txt-l" align="left" style="padding:0;Margin:0;padding-left:15px;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#333333;font-size:14px"><span style="font-size:16px"><strong>${getCurrency(
      campaigns[1].funding.currency
    )}${
        campaigns[1].funding.amountRaised
      }</strong></span><span style="font-size:16px">&nbsp;<span style="color:#A9A9A9">raised of ${getCurrency(
        campaigns[1].funding.currency
      )}${campaigns[1].funding.amountExpected}</span></span></p></td>
    </tr>
    </table></td>
    </tr>
    </table>`
    }
    <!--[if mso]></td></tr></table><![endif]--></td>
    </tr>
    <!--  row ends campaigns  -->
    </table></td>
    </tr>
    </table>
    <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA">
    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:580px">
    <tr>
    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" valign="top" style="padding:0;Margin:0;width:540px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px"><span class="es-button-border" style="border-style:solid;border-color:#2cb543;background:#6979f8;border-width:0px;display:block;border-radius:5px;width:auto"><a href=${
      process.env.MAINURL
    }/search class="es-button es-button-1" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:16px;border-style:solid;border-color:#6979f8;border-width:15px 20px;display:block;background:#6979f8;border-radius:5px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-weight:normal;font-style:normal;line-height:19px;width:auto;text-align:center">See other campaigns</a></span></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-bottom:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#333333;font-size:16px">Feeling inspired? <a target="_blank" href=${
      process.env.MAINURL
    }/StartACampaign style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#6979f8;font-size:16px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif">Start a Campaign!</a></p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA">
    <table class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FAFAFA;width:580px" bgcolor="#FAFAFA">
    <tr>
    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-bottom:25px">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" valign="top" style="padding:0;Margin:0;width:580px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0;font-size:0">
    <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px"></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px">
    <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td valign="top" align="center" style="padding:0;Margin:0;width:540px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#a9a9a9;font-size:14px">Copyright ©Fund &amp; Trace, All rights reserved</p></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;font-size:0px">
    <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://facebook.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img title="Facebook" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/facebook-logo-gray.png" alt="Fb" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://twitter.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img title="Twitter" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/twitter-logo-gray.png" alt="Tw" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://instagram.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img title="Instagram" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/instagram-logo-gray.png" alt="Inst" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank" href="https://youtube.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img title="Youtube" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/youtube-logo-gray.png" alt="Yt" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-bottom:10px;padding-top:30px"><h3 style="Margin:0;line-height:19px;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:16px;font-style:normal;font-weight:normal;color:#a9a9a9">Our mailing address is:</h3></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#d3d3d3;font-size:14px">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ullamcorper at tempus commodo</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table>
    </div>
    </body>
    </html>
    
    `,
  };

  try {
    await sendEmail(mailOptions);
    logger.info("Funding summary mail sent");
  } catch (err) {
    logger.error({ err }, "Funding summary mail failed");
    throw err;
  }
};
