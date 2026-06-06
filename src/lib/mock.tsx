import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export type Role = "Admin" | "Procurement Officer" | "Vendor" | "Manager";

export interface Profile {
  id: string;
  firstName: string;
  email: string;
  phone: string;
  role: Role;
  country: string;
  notes?: string;
  avatar?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  gst: string;
  contact: string;
  rating: number;
  status: "Active" | "Pending" | "Blocked";
}

export interface RFQItem { name: string; qty: number; description: string }
export interface RFQ {
  id: string;
  title: string;
  category: string;
  deadline: string;
  items: RFQItem[];
  assignedVendorIds: string[];
  status: "Draft" | "Open" | "Closed";
  createdAt: string;
}

export interface QuotationLine { item: string; qty: number; unitPrice: number }
export interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  lines: QuotationLine[];
  deliveryDays: number;
  notes?: string;
  submittedAt: string;
  status: "Submitted" | "Selected" | "Rejected";
}

export interface Approval {
  id: string;
  quotationId: string;
  state: "Pending" | "Under Review" | "Approved" | "Rejected";
  remarks?: string;
  approver?: string;
  updatedAt: string;
}

export interface PurchaseDoc {
  id: string;
  poNumber: string;
  quotationId: string;
  vendorId: string;
  date: string;
  status: "Pending Payment" | "Paid";
}

export interface ActivityLog {
  id: string;
  type: "rfq" | "approval" | "vendor" | "po" | "quotation";
  message: string;
  timestamp: string;
}

interface State {
  role: Role;
  setRole: (r: Role) => void;
  profiles: Profile[];
  vendors: Vendor[];
  rfqs: RFQ[];
  quotations: Quotation[];
  approvals: Approval[];
  documents: PurchaseDoc[];
  logs: ActivityLog[];
  addVendor: (v: Omit<Vendor, "id">) => void;
  addRFQ: (r: Omit<RFQ, "id" | "createdAt" | "status">) => void;
  addQuotation: (q: Omit<Quotation, "id" | "submittedAt" | "status">) => void;
  updateApproval: (id: string, patch: Partial<Approval>) => void;
  addProfile: (p: Omit<Profile, "id">) => void;
  log: (l: Omit<ActivityLog, "id" | "timestamp">) => void;
  refreshData: () => Promise<void>;
  isDbConnected: boolean;
  currentProfile: Profile | null;
  setCurrentProfile: (p: Profile | null) => void;
}

const Ctx = createContext<State | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const seedVendors: Vendor[] = [
  { id: "v1", name: "Infra Supplies Pvt Ltd", category: "Furniture", gst: "22AAAAA0000A1Z5", contact: "+91 98200 11111", rating: 4.6, status: "Active" },
  { id: "v2", name: "TechCore Ltd", category: "IT Hardware", gst: "27BBBBB1111B2Z6", contact: "+91 98765 43210", rating: 4.3, status: "Active" },
  { id: "v3", name: "FastLog Logistics", category: "Logistics", gst: "29CCCCC2222C3Z7", contact: "+91 99887 76655", rating: 3.9, status: "Active" },
  { id: "v4", name: "Stationery World", category: "Stationery", gst: "07DDDDD3333D4Z8", contact: "+91 90000 12345", rating: 4.1, status: "Pending" },
  { id: "v5", name: "GreenBuild Co", category: "Construction", gst: "19EEEEE4444E5Z9", contact: "+91 87654 32100", rating: 4.5, status: "Active" },
];

const seedRFQs: RFQ[] = [
  {
    id: "r1", title: "Office Furniture Procurement Q2", category: "Furniture",
    deadline: "2026-06-15",
    items: [
      { name: "Ergonomic Chair", qty: 25, description: "Mesh back, adjustable" },
      { name: "Standing Desk", qty: 10, description: "Electric height-adjust" },
    ],
    assignedVendorIds: ["v1", "v5"],
    status: "Open", createdAt: "2026-05-20",
  },
  {
    id: "r2", title: "Laptops for Engineering Team", category: "IT Hardware",
    deadline: "2026-06-28",
    items: [{ name: "Laptop 16GB", qty: 40, description: "i7 / 512GB SSD" }],
    assignedVendorIds: ["v2"],
    status: "Open", createdAt: "2026-05-28",
  },
];

const seedQuotations: Quotation[] = [
  { id: "q1", rfqId: "r1", vendorId: "v1", lines: [{ item: "Ergonomic Chair", qty: 25, unitPrice: 3600 }, { item: "Standing Desk", qty: 10, unitPrice: 9200 }], deliveryDays: 14, submittedAt: "2026-05-25", status: "Submitted" },
  { id: "q2", rfqId: "r1", vendorId: "v5", lines: [{ item: "Ergonomic Chair", qty: 25, unitPrice: 3850 }, { item: "Standing Desk", qty: 10, unitPrice: 8900 }], deliveryDays: 18, submittedAt: "2026-05-26", status: "Submitted" },
  { id: "q3", rfqId: "r2", vendorId: "v2", lines: [{ item: "Laptop 16GB", qty: 40, unitPrice: 68000 }], deliveryDays: 21, submittedAt: "2026-05-30", status: "Submitted" },
];

const seedApprovals: Approval[] = [
  { id: "a1", quotationId: "q1", state: "Under Review", approver: "Priya Shah", updatedAt: "2026-06-01" },
  { id: "a2", quotationId: "q3", state: "Pending", updatedAt: "2026-06-02" },
];

const seedDocs: PurchaseDoc[] = [
  { id: "d1", poNumber: "PO-2026-0061", quotationId: "q1", vendorId: "v1", date: "2026-05-21", status: "Pending Payment" },
];

const seedLogs: ActivityLog[] = [
  { id: "l1", type: "quotation", message: "Quotation submitted — Infra Supplies Pvt Ltd selected for Office Furniture Q2", timestamp: "2026-06-02T16:15:00Z" },
  { id: "l2", type: "approval", message: "Approval pending — PO-2026 awaiting L2 approval by Priya Shah", timestamp: "2026-06-02T14:55:00Z" },
  { id: "l3", type: "rfq", message: "RFQ published — Office Furniture Q2 sent to 3 vendors", timestamp: "2026-05-20T11:00:00Z" },
  { id: "l4", type: "vendor", message: "Vendor added — FastLog Logistics registered and pending verification", timestamp: "2026-05-18T09:20:00Z" },
];

const seedProfiles: Profile[] = [
  { id: "p1", firstName: "Akshat", email: "akshat@vendorbridge.app", phone: "+91 90000 00001", role: "Procurement Officer", country: "India", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop" },
];

export function MockProvider({ children }: { children: ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vendorbridge_profile");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [role, setRole] = useState<Role>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vendorbridge_role");
      if (saved) return saved as Role;
    }
    return "Procurement Officer";
  });

  const [profiles, setProfiles] = useState(seedProfiles);
  const [vendors, setVendors] = useState(seedVendors);
  const [rfqs, setRFQs] = useState(seedRFQs);
  const [quotations, setQuotations] = useState(seedQuotations);
  const [approvals, setApprovals] = useState(seedApprovals);
  const [documents, setDocuments] = useState(seedDocs);
  const [logs, setLogs] = useState(seedLogs);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const changeRole = (r: Role) => {
    setRole(r);
    setCurrentProfile((prev) => {
      if (!prev) return null;
      const matched = profiles.find((p) => p.role === r);
      if (matched) return matched;
      return {
        ...prev,
        firstName: r === "Admin" ? "Kartik Parmar" : prev.firstName,
        email: r === "Admin" ? "kartikparmar.dev@gmail.com" : prev.email,
        role: r,
        phone: prev.phone || "",
        country: prev.country || "",
      };
    });
  };

  // Sync data from Supabase
  const refreshData = async () => {
    if (!supabase) return;
    try {
      // Fetch Profiles
      const { data: dbProfiles, error: errProfiles } = await supabase.from("profiles").select("*");
      if (errProfiles) throw errProfiles;

      // Fetch Vendors
      const { data: dbVendors, error: errVendors } = await supabase.from("vendors").select("*");
      if (errVendors) throw errVendors;

      // Fetch RFQs
      const { data: dbRfqs, error: errRfqs } = await supabase.from("rfqs").select("*");
      if (errRfqs) throw errRfqs;

      // Fetch Quotations
      const { data: dbQuotations, error: errQuotations } = await supabase.from("quotations").select("*");
      if (errQuotations) throw errQuotations;

      // Fetch Approvals
      const { data: dbApprovals, error: errApprovals } = await supabase.from("approvals").select("*");
      if (errApprovals) throw errApprovals;

      // Fetch Procurement Documents
      const { data: dbDocs, error: errDocs } = await supabase.from("procurement_documents").select("*");
      if (errDocs) throw errDocs;

      // Fetch Logs
      const { data: dbLogs, error: errLogs } = await supabase.from("activity_logs").select("*");
      if (errLogs) throw errLogs;

      // If we made it here, Supabase query succeeded
      setIsDbConnected(true);

      if (dbProfiles) {
        setProfiles(dbProfiles.map(p => ({
          id: p.id,
          firstName: p.first_name,
          email: p.email,
          phone: p.phone_number || "",
          role: p.role as Role,
          country: p.country || "",
        })));
      }

      if (dbVendors) {
        setVendors(dbVendors.map(v => ({
          id: v.id,
          name: v.company_name,
          category: v.category,
          gst: v.gst_number,
          contact: v.contact_details || "",
          rating: Number(v.rating) || 5,
          status: v.status as any,
        })));
      }

      if (dbRfqs) {
        setRFQs(dbRfqs.map(r => {
          const details = typeof r.product_details === "string" ? JSON.parse(r.product_details) : r.product_details;
          return {
            id: r.id,
            title: r.title,
            category: details?.category || "General",
            deadline: new Date(r.deadline).toISOString().split('T')[0],
            items: details?.items || [],
            assignedVendorIds: details?.assignedVendorIds || [],
            status: r.status === "Active" ? "Open" : r.status as any,
            createdAt: details?.createdAt || new Date().toISOString(),
          };
        }));
      }

      if (dbQuotations) {
        setQuotations(dbQuotations.map(q => {
          let notesObj = { lines: [] as QuotationLine[], userNotes: "" };
          try {
            notesObj = JSON.parse(q.notes || "{}");
          } catch (e) {
            notesObj = { lines: [], userNotes: q.notes || "" };
          }
          return {
            id: q.id,
            rfqId: q.rfq_id,
            vendorId: q.vendor_id,
            lines: notesObj.lines || [],
            deliveryDays: q.delivery_timeline,
            notes: notesObj.userNotes || q.notes || "",
            submittedAt: new Date().toISOString(),
            status: q.status === "Accepted" ? "Selected" : q.status as any,
          };
        }));
      }

      if (dbApprovals) {
        setApprovals(dbApprovals.map(a => ({
          id: a.id,
          quotationId: a.quotation_id,
          state: a.status === "Pending" ? "Pending" : a.status as any,
          remarks: a.remarks || "",
          approver: a.approver_id || "",
          updatedAt: new Date().toISOString(),
        })));
      }

      if (dbDocs) {
        setDocuments(dbDocs.map(d => {
          const q = dbQuotations?.find(quot => quot.id === d.quotation_id);
          return {
            id: d.id,
            poNumber: `PO-2026-${String(d.po_number).padStart(4, "0")}`,
            quotationId: d.quotation_id,
            vendorId: q?.vendor_id || "v1",
            date: new Date(d.created_at).toISOString().split('T')[0],
            status: d.po_status === "Paid" ? "Paid" : "Pending Payment",
          };
        }));
      }

      if (dbLogs) {
        setLogs(dbLogs.map(l => ({
          id: l.id,
          type: (l.action || "rfq") as any,
          message: l.details || "",
          timestamp: l.created_at,
        })));
      }
    } catch (error) {
      console.warn("Supabase fetch failed, falling back to mock local data:", error);
      setIsDbConnected(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      refreshData();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          try {
            // Fetch profile
            const { data: dbProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (dbProfile) {
              const profile = {
                id: dbProfile.id,
                firstName: dbProfile.first_name || session.user.email?.split("@")[0] || "User",
                email: dbProfile.email || session.user.email || "",
                phone: dbProfile.phone_number || "",
                role: (dbProfile.role || "Procurement Officer") as Role,
                country: dbProfile.country || "",
              };
              setCurrentProfile(profile);
              setRole(profile.role);
            } else {
              const mockProfile = {
                id: session.user.id,
                firstName: session.user.email?.split("@")[0] || "User",
                email: session.user.email || "",
                phone: "+91 00000 00000",
                role: "Procurement Officer" as Role,
                country: "India",
              };
              setCurrentProfile(mockProfile);
              setRole("Procurement Officer");
            }
          } catch (e) {
            console.warn("Error loading profile from auth session change:", e);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    if (currentProfile) {
      localStorage.setItem("vendorbridge_profile", JSON.stringify(currentProfile));
    } else {
      localStorage.removeItem("vendorbridge_profile");
    }
  }, [currentProfile]);

  useEffect(() => {
    localStorage.setItem("vendorbridge_role", role);
  }, [role]);

  const value = useMemo<State>(() => ({
    role,
    setRole: changeRole,
    profiles,
    vendors,
    rfqs,
    quotations,
    approvals,
    documents,
    logs,
    isDbConnected,
    refreshData,
    currentProfile,
    setCurrentProfile,
    addVendor: async (v) => {
      const newId = uid();
      const mappedVendor: Vendor = { ...v, id: newId };
      setVendors((p) => [mappedVendor, ...p]);

      if (supabase && isDbConnected) {
        try {
          const { error } = await supabase.from("vendors").insert({
            id: newId,
            company_name: v.name,
            category: v.category,
            gst_number: v.gst,
            contact_details: v.contact,
            rating: v.rating,
            status: v.status
          });
          if (error) throw error;
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
    addRFQ: async (r) => {
      const newId = uid();
      const mappedRFQ: RFQ = { ...r, id: newId, createdAt: now(), status: "Open" };
      setRFQs((p) => [mappedRFQ, ...p]);

      if (supabase && isDbConnected) {
        try {
          const { error } = await supabase.from("rfqs").insert({
            id: newId,
            title: r.title,
            description: r.category,
            product_details: {
              category: r.category,
              items: r.items,
              assignedVendorIds: r.assignedVendorIds,
              createdAt: now()
            },
            quantity: r.items.reduce((acc, curr) => acc + curr.qty, 0),
            deadline: new Date(r.deadline).toISOString(),
            status: "Active"
          });
          if (error) throw error;
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
    addQuotation: async (q) => {
      const newId = uid();
      const mappedQuotation: Quotation = { ...q, id: newId, submittedAt: now(), status: "Submitted" };
      setQuotations((p) => [mappedQuotation, ...p]);

      const totalPrice = q.lines.reduce((acc, curr) => acc + curr.qty * curr.unitPrice, 0);

      if (supabase && isDbConnected) {
        try {
          const { error } = await supabase.from("quotations").insert({
            id: newId,
            rfq_id: q.rfqId,
            vendor_id: q.vendorId,
            pricing_details: totalPrice,
            delivery_timeline: q.deliveryDays,
            notes: JSON.stringify({ lines: q.lines, userNotes: q.notes || "" }),
            status: "Submitted"
          });
          if (error) throw error;
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
    updateApproval: async (id, patch) => {
      setApprovals((p) => p.map((a) => a.id === id ? { ...a, ...patch, updatedAt: now() } : a));

      if (supabase && isDbConnected) {
        try {
          const dbStatus = patch.state === "Approved" ? "Approved" : patch.state === "Rejected" ? "Rejected" : "Pending";
          const { error } = await supabase.from("approvals").update({
            status: dbStatus,
            remarks: patch.remarks
          }).eq("id", id);
          if (error) throw error;
        } catch (e) {
          console.warn("Supabase update failed, local state updated:", e);
        }
      }
    },
    addProfile: async (p) => {
      const newId = uid();
      const mappedProfile: Profile = { ...p, id: newId };
      setProfiles((arr) => [mappedProfile, ...arr]);

      if (supabase && isDbConnected) {
        try {
          const { error } = await supabase.from("profiles").insert({
            id: newId,
            first_name: p.firstName,
            email: p.email,
            role: p.role,
            phone_number: p.phone,
            country: p.country
          });
          if (error) throw error;
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
    log: async (l) => {
      const newId = uid();
      const mappedLog: ActivityLog = { ...l, id: newId, timestamp: now() };
      setLogs((p) => [mappedLog, ...p]);

      if (supabase && isDbConnected) {
        try {
          const { error } = await supabase.from("activity_logs").insert({
            id: newId,
            action: l.type,
            details: l.message
          });
          if (error) throw error;
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
  }), [role, profiles, currentProfile, vendors, rfqs, quotations, approvals, documents, logs, isDbConnected]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within MockProvider");
  return v;
}
