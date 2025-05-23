import Header from "./components/Header";
import Transports from "./components/Transports";
import BannerLoggin from "./components/BannerLoggin";
import Footer from "./components/Footer";

function Login() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header>
        <button className="bg-blue-500 text-white px-10 py-2 rounded hover:bg-blue-600">
          Prihlásiť sa
        </button>
      </Header>
      <Transports />
      <BannerLoggin />
      <Footer />
    </div>
  );
}

export default Login;
