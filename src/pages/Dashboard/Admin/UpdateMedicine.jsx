import axios from "axios";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function UpdateMedicine() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { register, handleSubmit, reset, watch } = useForm();

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/medicines/${id}`)
      .then((res) => reset(res.data));
  }, [id, reset]);

  const purchasePrice = Number(watch("purchasePrice")) || 0;

  const profitPercent = Number(watch("profitPercent")) || 0;

  const sellingPrice = purchasePrice + (purchasePrice * profitPercent) / 100;

  const onSubmit = async (data) => {
    try {
      data.sellingPrice = sellingPrice;

      const res = await axios.put(
        `http://localhost:5000/api/medicines/${id}`,
        data,
      );

      console.log(res.data);

      Swal.fire({
        icon: "success",
        title: "Medicine Updated Successfully",
      });

      navigate("/dashboard/all-medicine");
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-3xl font-bold mb-8">Update Medicine</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid md:grid-cols-2 gap-5"
      >
        <input className="input input-bordered" {...register("medicineName")} />

        <input className="input input-bordered" {...register("genericName")} />

        <input className="input input-bordered" {...register("company")} />

        <input className="input input-bordered" {...register("category")} />

        <input
          className="input input-bordered"
          type="number"
          {...register("purchasePrice")}
        />

        <input
          className="input input-bordered"
          type="number"
          {...register("profitPercent")}
        />

        <input
          className="input input-bordered bg-gray-100"
          value={sellingPrice}
          readOnly
        />

        <input
          className="input input-bordered"
          type="number"
          {...register("stock")}
        />

        <button className="btn btn-primary md:col-span-2">
          Update Medicine
        </button>
      </form>
    </div>
  );
}

export default UpdateMedicine;
