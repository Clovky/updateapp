import Header from "./components/Header";
import Transports from "./components/Transports";
import Table from "./components/Table";
import Footer from "./components/Footer";

function Actuall() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Transports />
      <Table history={false} />
      <Footer />
    </div>
  );
}

export default Actuall;
