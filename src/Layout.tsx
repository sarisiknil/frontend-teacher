import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "4rem" }}>
        <Outlet />
      </main>
    </>
  );
}
