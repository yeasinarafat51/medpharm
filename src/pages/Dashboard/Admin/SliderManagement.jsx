import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaTimes,
  FaImages,
} from "react-icons/fa";

const API_URL = "https://medpharm-server-sgs6.vercel.app";

const initialForm = {
  title: "",
  description: "",
  image: "",
  buttonText: "Shop Now",
  buttonLink: "/all-medicines",
  isActive: true,
  order: 1,
};

function SliderManagement() {
  const [sliders, setSliders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);

  // =====================================================
  // LOAD
  // =====================================================

  const loadSliders = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/sliders`);

      setSliders(res.data?.sliders || []);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to load sliders",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSliders();
  }, []);

  // =====================================================
  // INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      return Swal.fire("Required", "Slider title is required", "warning");
    }

    if (!form.image.trim()) {
      return Swal.fire("Required", "Slider image URL is required", "warning");
    }

    try {
      setSaving(true);

      if (editingId) {
        await axios.put(`${API_URL}/api/sliders/${editingId}`, form);

        Swal.fire({
          icon: "success",
          title: "Slider Updated",
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        await axios.post(`${API_URL}/api/sliders`, form);

        Swal.fire({
          icon: "success",
          title: "Slider Added",
          timer: 1200,
          showConfirmButton: false,
        });
      }

      setForm(initialForm);

      setEditingId(null);

      loadSliders();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (slider) => {
    setEditingId(slider._id);

    setForm({
      title: slider.title || "",
      description: slider.description || "",
      image: slider.image || "",
      buttonText: slider.buttonText || "Shop Now",
      buttonLink: slider.buttonLink || "/all-medicines",
      isActive: slider.isActive !== false,
      order: slider.order || 1,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const cancelEdit = () => {
    setEditingId(null);

    setForm(initialForm);
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Slider?",
      text: "This slider will be permanently deleted.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/api/sliders/${id}`);

      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1000,
        showConfirmButton: false,
      });

      loadSliders();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error.message,
      });
    }
  };

  // =====================================================
  // TOGGLE
  // =====================================================

  const handleToggle = async (id) => {
    try {
      await axios.patch(`${API_URL}/api/sliders/${id}/toggle`);

      loadSliders();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg">
          <FaImages />
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-800 sm:text-3xl">
            Slider Management
          </h1>

          <p className="text-sm text-gray-500">
            Add, edit and manage NovaCare homepage sliders.
          </p>
        </div>
      </div>

      {/* =================================================
          FORM
      ================================================= */}

      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {editingId ? "Edit Slider" : "Add New Slider"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
            >
              <FaTimes />
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {/* TITLE */}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Slider Title
            </label>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Welcome to NovaCare"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* IMAGE */}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Image URL
            </label>

            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/banner.jpg"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* DESCRIPTION */}

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Write slider description..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* BUTTON TEXT */}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Button Text
            </label>

            <input
              name="buttonText"
              value={form.buttonText}
              onChange={handleChange}
              placeholder="Shop Now"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* BUTTON LINK */}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Button Link
            </label>

            <input
              name="buttonLink"
              value={form.buttonLink}
              onChange={handleChange}
              placeholder="/all-medicines"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* ORDER */}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Slide Order
            </label>

            <input
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              min="1"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* ACTIVE */}

          <div className="flex items-center">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-5 w-5 accent-blue-600"
              />

              <span className="font-semibold text-gray-700">Active Slider</span>
            </label>
          </div>

          {/* BUTTON */}

          <div className="md:col-span-2">
            <button
              disabled={saving}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {editingId ? (
                <>
                  <FaSave />
                  {saving ? "Updating..." : "Update Slider"}
                </>
              ) : (
                <>
                  <FaPlus />
                  {saving ? "Adding..." : "Add Slider"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* =================================================
          SLIDER LIST
      ================================================= */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            Loading sliders...
          </div>
        ) : sliders.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white py-20 text-center shadow-sm">
            <FaImages className="mx-auto text-5xl text-gray-300" />

            <h3 className="mt-4 text-xl font-bold text-gray-700">
              No Sliders Found
            </h3>
          </div>
        ) : (
          sliders.map((slider) => (
            <div
              key={slider._id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              {/* IMAGE */}

              <div className="relative">
                <img
                  src={slider.image}
                  alt={slider.title}
                  className="h-48 w-full object-cover"
                />

                <span
                  className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white ${
                    slider.isActive ? "bg-green-600" : "bg-gray-500"
                  }`}
                >
                  {slider.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              {/* CONTENT */}

              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="line-clamp-1 text-lg font-black text-gray-800">
                    {slider.title}
                  </h3>

                  <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">
                    #{slider.order}
                  </span>
                </div>

                <p className="line-clamp-2 text-sm text-gray-500">
                  {slider.description}
                </p>

                {/* ACTIONS */}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(slider._id)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
                  >
                    {slider.isActive ? <FaEyeSlash /> : <FaEye />}

                    {slider.isActive ? "Hide" : "Show"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(slider)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-blue-50 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100"
                  >
                    <FaEdit />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(slider._id)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SliderManagement;
