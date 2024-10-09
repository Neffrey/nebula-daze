"use client";

// LIBS

// UTILS
import useProductStore from "~/components/stores/product-store";

// COMPONENTS
import { Button } from "~/components/ui/button";

const AdminForceSync = () => {
  const current_page = useProductStore((state) => state.currentPage);
  const productData = useProductStore((state) => state.data);

  const handleLogData = () => {
    console.log("current_page: ", current_page);
    console.log("productData: ", productData);
  };

  return (
    <div className="p-3">
      <h2>Admin Force Sync</h2>
      <Button onClick={() => handleLogData()}>Log Data</Button>
      <div className="p-3"></div>
    </div>
  );
};

export default AdminForceSync;
