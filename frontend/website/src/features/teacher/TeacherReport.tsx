import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Report = {
  teacher: { id: string; fullName: string; email: string | null; lastLoginAt: string | null };
  metrics: { classes: number; students: number; assignments: number; liveSessions: number; earnedKes: number };
  classes: { id: string; title: string; capacity: number }[];
  generatedAt: string;
};

export function TeacherReport() {
  const [search] = useSearchParams();
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState("Generating teacher report…");

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      const teacherId = search.get("teacher") ?? data.user?.id;
      if (!teacherId) throw new Error("Teacher report target is missing");
      const { data: result, error } = await supabase.rpc("teacher_team_report", { target_teacher: teacherId });
      if (error) throw error;
      setReport(result as Report);
      setStatus("");
    }).catch((error: Error) => setStatus(error.message));
  }, [search]);

  return <div>
    <div className="page-head"><div><p className="eyebrow">Teaching performance</p><h1>{report?.teacher.fullName || "Teacher report"}</h1></div><span className="status-chip">Generated {report ? new Date(report.generatedAt).toLocaleString() : "now"}</span></div>
    {status && <p className="form-message">{status}</p>}
    {report && <>
      <div className="stats">
        <article><small>Students</small><strong>{report.metrics.students}</strong><span>Distinct active learners</span></article>
        <article><small>Classes</small><strong>{report.metrics.classes}</strong><span>Owned or assigned</span></article>
        <article><small>Assignments</small><strong>{report.metrics.assignments}</strong><span>Published by this teacher</span></article>
        <article><small>Live sessions</small><strong>{report.metrics.liveSessions}</strong><span>Created classrooms</span></article>
        <article><small>Teacher earnings</small><strong>KES {Number(report.metrics.earnedKes).toLocaleString()}</strong><span>Recorded Paystack splits</span></article>
        <article><small>Last login</small><strong className="metric-date">{report.teacher.lastLoginAt ? new Date(report.teacher.lastLoginAt).toLocaleDateString() : "Never"}</strong><span>{report.teacher.email || "No stored email"}</span></article>
      </div>
      <section className="panel"><h2>Classes</h2>{report.classes.map((item) => <p className="activity" key={item.id}>{item.title}<small>Capacity {item.capacity} learners</small></p>)}{!report.classes.length && <p className="empty-state">No classes assigned to this teacher.</p>}</section>
    </>}
  </div>;
}
