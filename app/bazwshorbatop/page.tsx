'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DelegateRecord = {
  DelegateID: string;
  Name: string;
  Grade: string;
  CouncilName: string;
  BusRegistered: boolean;
  Status?: "Present" | "Absent" | null;
};

export default function WeekBAttendanceAdmin() {
  const [records, setRecords] = useState<DelegateRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchDelegates() {
      setLoading(true);
      const { data, error } = await supabase
        .from("Attendance_View")
        .select("*")
        .order("DelegateID", { ascending: true });

      if (error) console.error("Error fetching delegates:", error.message);
      else setRecords(data || []);
      setLoading(false);
    }
    fetchDelegates();
  }, []);

  useEffect(() => {
    async function fetchAttendance() {
      const { data: attendance } = await supabase
        .from("Attendance")
        .select("DelegateID, Status, Date")
        .eq("Date", selectedDate);

      if (attendance && attendance.length > 0) {
        setRecords(prev =>
          prev.map(r => {
            const att = attendance.find(a => a.DelegateID === r.DelegateID);
            return { ...r, Status: att ? att.Status : "Absent" };
          })
        );
      } else {
        setRecords(prev => prev.map(r => ({ ...r, Status: "Absent" })));
      }
    }
    fetchAttendance();
  }, [selectedDate]);

  async function markAttendance(delegateID: string, status: "Present" | "Absent") {
    const { error } = await supabase.from("Attendance").upsert(
      { DelegateID: delegateID, Date: selectedDate, Status: status },
      { onConflict: "DelegateID,Date" }
    );
    if (!error) {
      setRecords(prev =>
        prev.map(r => r.DelegateID === delegateID ? { ...r, Status: status } : r)
      );
    }
  }

  const filteredRecords = records.filter(r =>
    [r.DelegateID, r.Name, r.CouncilName]
      .some(val => val?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <header className="dashboard-header">
                  <Image src="/logo.png" alt="NCIMUN Logo" width={60} height={60} />
                  <h1>Week C Attendance</h1>
           </header>
          <div className="flex justify-center mt-6">
            <div className="flex justify-center items-center gap-3 flex-wrap">
              <Image src="/reg1.png" alt="Registration 1" width={80} height={80} className="rounded-lg shadow-md" />
              <Image src="/reg2.png" alt="Registration 2" width={80} height={80} className="rounded-lg shadow-md" />
              <Image src="/reg3.png" alt="Registration 3" width={80} height={80} className="rounded-lg shadow-md" />
              <Image src="/reg4.png" alt="Registration 4" width={80} height={80} className="rounded-lg shadow-md" />
            </div>
            <h4>⋅˚₊‧ 𐙚 ‧₊˚ ⋅ REG GIRLS ON TOP ⋅˚₊‧ 𐙚 ‧₊˚ ⋅</h4>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            Select Day:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-md"
            />
          </label>
            Search:
          <input
            type="text"
            placeholder="Search by name, ID, or council..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md w-full md:w-72 focus:ring-2 focus:ring-ncimun-blue"
          />
          
            Total Delegates: {filteredRecords.length}
          
        </div>

     
      

        {/* Table */}
        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="payments-table">
              <thead className="bg-ncimun-blue text-white uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Delegate ID</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-center">Grade</th>
                  <th className="px-3 py-2 text-left">Council</th>
                  <th className="px-3 py-2 text-center">Bus</th>
                  <th className="px-3 py-2 text-center">Attendance</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r) => (
                    <tr key={r.DelegateID} className="hover:bg-gray-100">
                      <td className="px-3 py-2">{r.DelegateID}</td>
                      <td className="px-3 py-2">{r.Name}</td>
                      <td className="px-3 py-2 text-center">{r.Grade}</td>
                      <td className="px-3 py-2">{r.CouncilName}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded-md ${r.BusRegistered ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {r.BusRegistered ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded-md ${r.Status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {r.Status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center flex justify-center gap-2">
                        <button
                          onClick={() => markAttendance(r.DelegateID, "Present")}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => markAttendance(r.DelegateID, "Absent")}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                        >
                          Absent
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No delegates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
