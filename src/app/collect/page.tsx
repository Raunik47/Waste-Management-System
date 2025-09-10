"use client";

import { useState, useEffect } from "react";
import { MapPin, Trash2, Weight, Calendar, Search, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  getWasteCollectionTasks,
  updateTaskStatus,
  saveReward,
  saveCollectedWaste,
  getUserByEmail,
} from "../../../utils/db/actions";
import UploadWidget from "@/components/UploadWidget";
import { verifyWaste, WasteVerification } from "@/lib/gemini"; // ✅ use WasteVerification

// Type for collection tasks
type CollectionTask = {
  id: number;
  location: string;
  wasteType: string;
  amount: string;
  status: "pending" | "in_progress" | "completed" | "verified";
  date: string;
  collectorId: number | null;
};

const ITEMS_PER_PAGE = 5;

export default function CollectPage() {
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);

  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<"idle" | "verifying" | "success" | "failure">("idle");
  const [verificationResult, setVerificationResult] =
    useState<WasteVerification | null>(null); // ✅ correct type

  const [reward, setReward] = useState<number | null>(null);

  // Fetch user and tasks on component mount
  useEffect(() => {
    const fetchUserAndTasks = async () => {
      setLoading(true);
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) setUser(fetchedUser);
          else toast.error("User not found. Please log in again.");
        } else {
          toast.error("User not logged in.");
        }

        const fetchedTasks = await getWasteCollectionTasks();
        setTasks(fetchedTasks as CollectionTask[]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, []);

  // Update task status (e.g., pending → in_progress → verified)
  const handleStatusChange = async (
    taskId: number,
    newStatus: CollectionTask["status"]
  ) => {
    if (!user) {
      toast.error("Please log in.");
      return;
    }

    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus, user.id);
      if (updatedTask) {
        setTasks((tasks) =>
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: newStatus, collectorId: user.id }
              : task
          )
        );
        toast.success("Task status updated.");
      } else {
        toast.error("Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error occurred.");
    }
  };

  // Verify uploaded image using Gemini API
  const handleVerify = async () => {
    if (!selectedTask || !preview || !user) {
      toast.error("Missing data for verification.");
      return;
    }

    setVerificationStatus("verifying");

    try {
      const result = await verifyWaste(preview, {
        wasteType: selectedTask.wasteType,
        amount: selectedTask.amount,
      });

      setVerificationResult(result); // ✅ now matches state type
      setVerificationStatus("success");

      
      // Optional: require both matches
      if (result.wasteTypeMatch || result.quantityMatch && result.confidence > 0.7) {
        await handleStatusChange(selectedTask.id, "verified");

        const earnedReward = Math.floor(Math.random() * 50) + 10;
        await saveReward(user.id, earnedReward);
        await saveCollectedWaste(selectedTask.id, user.id, result);

        setReward(earnedReward);
        toast.success(`Verified successfully! Reward: ${earnedReward} tokens.`);
      } else {
        toast.error("Verification failed. Type or amount didn’t match.");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      setVerificationStatus("failure");
      toast.error("Verification failed. Please upload a clearer image.");
    }
  };

  // Pagination
  const filteredTasks = tasks.filter((task) =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-4xl font-extrabold text-center text-green-700 mb-10">
        🌿 Waste Collection Tasks
      </h1>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500"
        />
        <button className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow transition">
          <Search className="inline-block h-5 w-5 mr-2" />
          Search
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader className="animate-spin h-10 w-10 text-green-500" />
        </div>
      ) : (
        <div className="grid gap-6">
          {paginatedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold flex items-center text-green-700 mb-3">
                <MapPin className="mr-2" /> {task.location}
              </h2>
              <p>
                <Trash2 className="inline mr-2 text-gray-600" />{" "}
                <strong>Type:</strong> {task.wasteType}
              </p>
              <p>
                <Weight className="inline mr-2 text-gray-600" />{" "}
                <strong>Amount:</strong> {task.amount}
              </p>
              <p>
                <Calendar className="inline mr-2 text-gray-600" />{" "}
                <strong>Date:</strong> {task.date}
              </p>

              <div className="mt-4 space-x-3">
                {task.status === "pending" && (
                  <button
                    onClick={() => handleStatusChange(task.id, "in_progress")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Start Collection
                  </button>
                )}
                {task.status === "in_progress" && (
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Complete & Verify
                  </button>
                )}
                {task.status === "verified" && (
                  <span className="inline-block text-green-600 font-semibold">
                    Verified ✅ Reward Earned
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-8">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-700 font-medium">
          Page {currentPage} of {pageCount}
        </span>
        <button
          disabled={currentPage === pageCount}
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, pageCount))
          }
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modal for Verification */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-green-700 mb-5">
              Verify Collected Waste
            </h3>

            <UploadWidget
              preview={preview}
              setPreview={setPreview}
              setNewReport={() => {}}
            />

            <button
              onClick={handleVerify}
              disabled={verificationStatus === "verifying" || !preview}
              className="w-full mt-4 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              {verificationStatus === "verifying" ? "Verifying..." : "Verify"}
            </button>

            {verificationStatus === "success" && verificationResult && (
              <div className="mt-5 bg-green-100 p-4 rounded">
                <p>
                  <strong>Type Match:</strong>{" "}
                  {verificationResult.wasteTypeMatch ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <strong>Quantity Match:</strong>{" "}
                  {verificationResult.quantityMatch ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <strong>Confidence:</strong>{" "}
                  {(verificationResult.confidence * 100).toFixed(2)}%
                </p>
                {reward && (
                  <p>
                    <strong>Reward Earned:</strong> {reward} tokens
                  </p>
                )}
              </div>
            )}

            {verificationStatus === "failure" && (
              <p className="mt-4 text-red-600">
                ❌ Verification failed. Please upload a clearer image.
              </p>
            )}

            <button
              onClick={() => {
                setSelectedTask(null);
                setPreview(null);
                setVerificationStatus("idle");
                setVerificationResult(null);
                setReward(null);
              }}
              className="mt-6 w-full px-4 py-3 border border-gray-300 rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
