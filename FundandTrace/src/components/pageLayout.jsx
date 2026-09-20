import Footer from "../components/Footer/Footer";

export default function PageLayout({ children }) {
  return (
    <div>
      {children}
      <Footer />
    </div>
  );
}
