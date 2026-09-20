const { getCurrency } = require("../utility/converter");
const { createTransporter } = require("./mailing");

exports.campaignTargetReachedMailService = async (user, campaign) => {
  const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  };

  let mailOptions = {
    from: "fundandtrace@gmail.com",
    to: user,
    subject: "Funds Released",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif">
    <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>New email template 2021-07-06</title>
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
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,400i,700,700i" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,400i,700,700i" rel="stylesheet">
    <!--<![endif]-->
    <style type="text/css">
    .rollover:hover .rollover-first {
    max-height:0px!important;
    display:none!important;
    }
    .rollover:hover .rollover-second {
    max-height:none!important;
    display:block!important;
    }
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
    .es-button-border:hover {
    border-style:solid solid solid solid!important;
    background:#0b317e!important;
    border-color:#42d159 #42d159 #42d159 #42d159!important;
    }
    .es-button-border:hover a.es-button, .es-button-border:hover button.es-button {
    background:#0b317e!important;
    border-color:#0b317e!important;
    }
    [data-ogsb] .es-button {
    border-width:0!important;
    padding:10px 20px 10px 20px!important;
    }
    td .es-button-border:hover a.es-button-1 {
    background:#aNaNaN!important;
    border-color:#aNaNaN!important;
    }
    td .es-button-border-2:hover {
    background:#aNaNaN!important;
    }
    [data-ogsb] .es-button.es-button-3 {
    padding:15px 20px!important;
    }
    @media only screen and (max-width:600px), screen and (max-device-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .st-br { padding-left:10px!important; padding-right:10px!important } h1 a { text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } h2 a { text-align:center } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important } h3 a { text-align:center } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button, button.es-button { font-size:16px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important; border-top-width:15px!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-m-margin { padding-left:10px!important; padding-right:10px!important; padding-top:10px!important; padding-bottom:10px!important } }
    </style>
    </head>
    <body style="width:100%;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div class="es-wrapper-color" style="background-color:#FAFAFA">
    <!--[if gte mso 9]>
    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
    <v:fill type="tile" color="#FAFAFA"></v:fill>
    </v:background>
    <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top; border-radius: 15px">
    <tr style="border-radius: 15px">
    <td class="es-m-margin" valign="top" style="padding:0;Margin:0; border-radius: 15px">
    <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA; padding-top: 20px">
    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px; border-radius: 15px">
    <tr style="border-radius: 15px">
    <td align="left" bgcolor="#ffffff" style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:30px;padding-right:30px;background-color:#ffffff;border-radius: 15px 15px 0 0">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" valign="top" style="padding:0;Margin:0;width:540px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;border-radius: 15px">
    <tr>
    <td align="center" style="padding:0;Margin:0;font-size:0px; padding-top: 15px"><img src=" https://res.cloudinary.com/wisdomosara/image/upload/v1620243876/logo_a50tjp.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="100"></td>
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
    <td align="center" style="padding:0;Margin:0">
    <table bgcolor="transparent" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px">
    <tr>
    <td align="left" bgcolor="#ffffff" style="padding:30px;Margin:0;background-color:#ffffff">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" valign="top" style="padding:0;Margin:0;width:540px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" class="es-m-txt-c" style="padding:0;Margin:0"><h2 style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:24px;font-style:normal;font-weight:bold;color:#212121;text-align:center"><strong>CONGRATULATIONS <br/>
    this campaign “${
      campaign.basicInformation.campaignTitle
    }” you donated for has reached its target!</strong></h2></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="left" bgcolor="#ffffff" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px;background-color:#ffffff">
    <!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:200px" valign="top"><![endif]-->
    <table cellspacing="0" cellpadding="0" align="left" class="es-left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
    <tr>
    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:200px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src=${
      campaign.basicInformation.campaignImage
    } alt style="object-fit: cover;display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="192"></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!--[if mso]></td><td style="width:20px"></td><td style="width:340px" valign="top"><![endif]-->
    <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
    <tr>
    <td align="left" style="padding:0;Margin:0;width:340px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:18px;color:#6979f8;font-size:12px">${campaign.category.toUppercase()}</p></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="left" style="padding:0;Margin:0;width:340px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="left" class="es-m-txt-l" style="padding:0;Margin:0;padding-top:15px;padding-bottom:20px"><h2 style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:'source sans pro', 'helvetica neue', helvetica, arial, sans-serif;font-size:24px;font-style:normal;font-weight:bold;color:#212121">${
      campaign.basicInformation.campaignTitle
    }</h2></td>
    </tr>
    <tr>
    <td style="padding:0;Margin:0">
    <div style="display:flex;align-items:center">
    <img src="https://res.cloudinary.com/wisdomosara/image/upload/v1630097683/location_tfjz3r.png" alt="location" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;margin-right:15px">
    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#131313;font-size:16px">${
      campaign.basicInformation.locationState
    }, ${campaign.basicInformation.locationCountry}</p>
    </div></td>
    </tr>
    <tr>
    <td align="left" style="padding:0;Margin:0;padding-top:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#131313;font-size:16px"><span style="font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif"><strong>${getCurrency(
      campaign.funding.currency
    )}${
      campaign.funding.amountRaised
    }&nbsp;</strong></span><span style="color:#A9A9A9">raised of ${getCurrency(
      campaign.funding.currency
    )}${campaign.funding.amountExpected}</span></p></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]--></td>
    </tr>
    <tr style="border-radius: 0px 0px 15px 15px">
    <td class="es-m-p20r es-m-p20l" align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-left:40px;padding-right:40px;background-color:#ffffff;border-radius: 0px 0px 15px 15px">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;border-radius: 0px 0px 15px 15px">
    <tr style="border-radius: 0 0 15px 15px">
    <td align="center" valign="top" style="padding:0;Margin:0;width:520px;border-radius: 0px 0px 15px 15px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px; border-radius: 0 0 15px 15px">
    <tr style="border-radius: 0 0 15px 15px">
    <td align="center" style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#131313;font-size:16px">You can track how the money raised for the campaign is being disbursed by clicking the button below.</p></td>
    </tr>
    <tr>
    <td align="center" class="es-m-p15r es-m-p15l" style="Margin:0;padding-top:10px;padding-bottom:25px;padding-left:40px;padding-right:40px"><span class="es-button-border-2 es-button-border" style="border-style:solid;border-color:#2CB543;background:#6979f8;border-width:0px;display:block;border-radius:5px;width:auto"><a href=${
      process.env.MAINURL
    }/campaign/${
      campaign._id
    }/tracker class="es-button es-button-1" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:16px;border-style:solid;border-color:#6979f8;border-width:15px 20px;display:block;background:#6979f8;border-radius:5px;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-weight:normal;font-style:normal;line-height:19px;width:auto;text-align:center">Track Campaign</a></span></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px;font-size:0">
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
    </table></td>
    </tr>
    </table>
    <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
    <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:0;Margin:0;background-color:#FAFAFA">
    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px; border-radius:15px">
    <tr style="border-radius: 0 0 15px 15px">
    <td align="left" style="padding:0;Margin:0; border-radius: 0 0 15px 15px">
    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px; border-radius: 0 0 15px 15px">
    <tr style="border-radius: 0 0 15px 15px">
    <td align="center" valign="top" style="padding:0;Margin:0;width:600px; border-radius: 0 0 15px 15px">
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px; border-radius: 0 0 15px 15px">
    <tr style="border-radius: 0 0 15px 15px">
    <td align="center" bgcolor="#ffffff" style="padding:0;Margin:0;padding-top:15px;padding-bottom:40px"><a name="click here" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#6979f8;font-size:16px" href=""></a><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:18px;color:#979797;font-size:12px">If you would like to opt out of emails from this campaign, <a target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#0000cd;font-size:12px;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif" href=https://wisdomabc.herokuapp.com/api/campaignEmailWhitelist?email=wisdomosara&campaignId=${
      campaign._id
    }>Click here</a></p></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-bottom:25px;padding-top:40px;font-size:0">
    <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px"></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'source sans pro', 'helvetica neue', helvetica, arial, sans-serif;line-height:14px;color:#979797;font-size:14px">Copyright ©Fund &amp; Trace, All rights reserved</p></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table></td>
    </tr>
    </table>
    <table cellpadding="0" cellspacing="0" class="es-header" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
    <tr>
    <td align="center" style="padding:0;Margin:0">
    <table class="es-header-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px">
    <tr>
    <td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px">
    <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td align="center" style="padding:0;Margin:0;font-size:0px">
    <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
    <tr>
    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://facebook.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img title="Facebook" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/facebook-logo-gray.png" alt="Fb" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://twitter.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img title="Twitter" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/twitter-logo-gray.png" alt="Tw" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://instagram.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img title="Instagram" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/instagram-logo-gray.png" alt="Inst" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank" href="https://youtube.com/fundandtrace" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img title="Youtube" src="https://luxvzd.stripocdn.email/content/assets/img/social-icons/logo-gray/youtube-logo-gray.png" alt="Yt" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
    </tr>
    </table></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-bottom:10px;padding-top:30px"><h3 style="Margin:0;line-height:19px;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:16px;font-style:normal;font-weight:normal;color:#a9a9a9">Our mailing address is:</h3></td>
    </tr>
    <tr>
    <td align="center" style="padding:0;Margin:0;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#d3d3d3;font-size:14px">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ullamcorper at tempus commodo</p></td>
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
    </html>`,
  };

  try {
    await sendEmail(mailOptions);
    logger.info("Campaign target reached mail sent");
  } catch (err) {
    logger.error({ err }, "Campaign target reached mail failed");
    throw err;
  }
};
