import axios from "axios";
import cookie from "cookie";

const handler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
      { email, password }
    );
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", response?.data?.data?.token, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV !== "development",
      })
    );

    res.status(200).json({
      success: response?.data?.status,
      message: response?.data?.message,
      data: response?.data?.data?.userProfile,
    });
  } catch (error) {
    return res.status(error?.response?.status).json({
      status: error?.response?.status,
      error: error?.response?.data?.error,
    });
  }
};

export default handler;
