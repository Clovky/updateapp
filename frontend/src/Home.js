import Header from "./components/Header";
import Transports from "./components/Transports";
import Banner from "./components/Banner";
import Footer from "./components/Footer";

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Transports />
      <Banner />
      <Footer />
    </div>
  );
}

export default Home;
