"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, CheckCircle, Loader, Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { Libraries } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import Upload from "@/components/UploadWidget";
import { analyzeWaste } from "@/lib/gemini"; // ✅ use analyzeWaste, not verifyWaste
import {
  createReport,
  createUser,
  getRecentReports,
  getUserByEmail,
} from "../../../utils/db/actions";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const libraries: Libraries = ["places"];

export default function ReportPage() {
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const router = useRouter();

  const [reports, setReports] = useState<
    Array<{ id: number; location: string; wasteType: string; amount: string; createdAt: string }>
  >([]);

  const [newReport, setNewReport] = useState({
    location: "",
    type: "",
    amount: "",
    image: "",
  });

  const [preview, setPreview] = useState<string | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");

  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string;
    quantity: string;
    confidence: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Maps autocomplete
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey!,
    libraries,
  });

  const onLoad = useCallback((ref: google.maps.places.Autocomplete) => {
    setAutocomplete(ref);
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place?.formatted_address) {
        setNewReport((prev) => ({
          ...prev,
          location: place.formatted_address ?? "",
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewReport((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * 🔍 Step 1: Analyze waste with Gemini
   */
  const handleVerify = async () => {
    if (!preview) {
      toast.error("Please upload an image first.");
      return;
    }

    setVerificationStatus("verifying");
    setVerificationResult(null);

    try {
      const result = await analyzeWaste(preview);

      if (!result || !result.wasteType) {
        setVerificationStatus("failure");
        toast.error("Could not analyze the image. Try again.");
        return;
      }

      setVerificationResult(result);
      setVerificationStatus("success");

      // Fill the form with AI result
      setNewReport((prev) => ({
        ...prev,
        type: result.wasteType,
        amount: result.quantity,
      }));

      toast.success("Waste analyzed successfully!");
    } catch (error) {
      console.error("handleVerify error:", error);
      setVerificationStatus("failure");
      toast.error("Verification failed. Try again later.");
    }
  };

  /**
   * 📝 Step 2: Submit report
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationStatus !== "success" || !user || !verificationResult) {
      toast.error("Please verify the waste before submitting or log in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const report = (await createReport(
        user.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview || undefined,
        newReport.type,
        verificationResult
      )) as any;

      if (!report) {
        toast.error("Failed to create report");
        setIsSubmitting(false);
        return;
      }

      const formattedReport = {
        id: report.id,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        createdAt: report.createdAt.toISOString().split("T")[0],
      };

      setReports((prev) => [formattedReport, ...prev]);
      setNewReport({ location: "", type: "", amount: "", image: "" });
      setPreview(null);
      setVerificationStatus("idle");
      setVerificationResult(null);

      toast.success("Report submitted successfully!");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 🔑 Step 3: Check user + load reports
   */
  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem("userEmail");
      if (email) {
        let u = await getUserByEmail(email);
        if (!u) u = await createUser(email, "Anonymous User");
        setUser(u);

        const recentReports = await getRecentReports();
        setReports(
          recentReports.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString().split("T")[0],
          }))
        );
      } else {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);









  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-green-200 p-8">
      <h1 className="text-5xl font-extrabold mb-12 text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent drop-shadow-md">
        🌱 Report Environmental Waste
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white/70 backdrop-blur-xl border border-green-200 p-10 rounded-3xl shadow-2xl mb-14 transition-transform hover:scale-[1.01]"
      >
        <Upload preview={preview} setPreview={setPreview} setNewReport={setNewReport} />

     <Button
  type="button"
  onClick={handleVerify}
  className="w-full mb-8 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-3 text-lg rounded-xl shadow-lg hover:shadow-green-400/50 transition-all"
  disabled={!preview || verificationStatus === "verifying"}
>
  {verificationStatus === "verifying" ? (
    <>
      <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Analyzing...
    </>
  ) : (
    "Analyze Waste ♻️"
  )}
</Button>

{verificationStatus === "success" && verificationResult && (
  <div className="bg-gradient-to-r from-green-100 to-green-200 border-l-4 border-green-600 p-5 mb-8 rounded-2xl shadow-lg animate-fadeIn">
    <div className="flex items-center">
      <CheckCircle className="h-7 w-7 text-green-600 mr-3" />
      <div>
        <h3 className="text-lg font-bold text-green-800">Analysis Successful ✅</h3>
        <div className="mt-2 text-sm text-green-700 space-y-1">
          <p>🗑 Waste Type: {verificationResult.wasteType}</p>
          <p>⚖️ Estimated Amount: {verificationResult.quantity}</p>
          <p>📊 Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  </div>
)}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-semibold text-green-700 mb-2">📍 Location</label>
            {isLoaded ? (
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter waste location"
                  value={newReport.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 shadow-sm"
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 shadow-sm"
                placeholder="Enter waste location"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-green-700 mb-2">🗑 Waste Type</label>
            <input
              type="text"
              name="type"
              value={newReport.type}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-green-700 mb-2">⚖️ Estimated Amount</label>
            <input
              type="text"
              name="amount"
              value={newReport.amount}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 shadow-inner"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-lg rounded-xl shadow-lg hover:shadow-indigo-400/50 transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Submitting...
            </>
          ) : (
            "Submit Report 🌍"
          )}
        </Button>
      </form>

      <h2 className="text-3xl font-extrabold mb-8 text-green-700 flex items-center gap-3">
        <Recycle className="w-8 h-8 text-green-600" /> Recent Reports
      </h2>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 border border-green-200 hover:shadow-2xl hover:scale-[1.02] transition-all hover:bg-gradient-to-r hover:from-emerald-100 hover:to-blue-100"
          >
            <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
              <MapPin className="w-6 h-6 text-green-500" />
              {report.location}
            </div>
            <p className="text-gray-800">
              <span className="font-medium">🗑 Type:</span> {report.wasteType}
            </p>
            <p className="text-gray-800">
              <span className="font-medium">⚖️ Amount:</span> {report.amount}
            </p>
            <p className="text-sm text-gray-500 mt-3">
              📅 {report.createdAt}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
