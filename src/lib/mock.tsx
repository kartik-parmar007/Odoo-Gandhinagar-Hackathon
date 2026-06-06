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
  // Gujarat-based vendors
  { id: "v6", name: "Akshar Infotech Solutions", category: "IT Hardware", gst: "24AAKCS9321F1ZP", contact: "+91 99099 45678", rating: 4.7, status: "Active" },
  { id: "v7", name: "Surat Textile Traders Pvt Ltd", category: "Textile & Fabric", gst: "24BTRST4567G2ZQ", contact: "+91 97234 78901", rating: 4.2, status: "Active" },
  { id: "v8", name: "Vadodara Industrial Supplies", category: "Industrial Equipment", gst: "24CVDIS8821H3ZR", contact: "+91 98792 33445", rating: 3.8, status: "Active" },
  { id: "v9", name: "Rajkot Precision Engineering", category: "Mechanical Parts", gst: "24DRJPE1234J4ZS", contact: "+91 96380 55667", rating: 4.4, status: "Pending" },
  { id: "v10", name: "Gandhinagar Office Essentials", category: "Stationery", gst: "24EGNOE7654K5ZT", contact: "+91 93745 12300", rating: 4.0, status: "Active" },
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
  // Gujarat-based RFQs
  {
    id: "r3", title: "Desktop Computers for Ahmedabad Branch", category: "IT Hardware",
    deadline: "2026-07-10",
    items: [
      { name: "Desktop PC Core i5", qty: 20, description: "8GB RAM, 256GB SSD, Windows 11" },
      { name: "24-inch Monitor", qty: 20, description: "Full HD IPS panel" },
    ],
    assignedVendorIds: ["v6", "v2"],
    status: "Open", createdAt: "2026-06-01",
  },
  {
    id: "r4", title: "Uniform Fabric for Surat Factory Staff", category: "Textile & Fabric",
    deadline: "2026-07-05",
    items: [
      { name: "Cotton Drill Fabric", qty: 500, description: "Navy blue, 150 GSM, standard cut" },
      { name: "Reflective Safety Vest", qty: 150, description: "ANSI Class 2 compliant" },
    ],
    assignedVendorIds: ["v7"],
    status: "Open", createdAt: "2026-06-03",
  },
  {
    id: "r5", title: "Industrial Compressors for Vadodara Plant", category: "Industrial Equipment",
    deadline: "2026-07-20",
    items: [
      { name: "Rotary Screw Compressor 10HP", qty: 3, description: "Oil-lubricated, 145 PSI max" },
      { name: "Air Dryer Unit", qty: 3, description: "Refrigerated type, compatible with above compressor" },
    ],
    assignedVendorIds: ["v8"],
    status: "Open", createdAt: "2026-06-04",
  },
  {
    id: "r6", title: "CNC Machined Spare Parts — Rajkot Unit", category: "Mechanical Parts",
    deadline: "2026-06-30",
    items: [
      { name: "Mild Steel Flange (DN50)", qty: 80, description: "IS 2062 Grade A, slip-on type" },
      { name: "Stainless Hex Bolt M12", qty: 500, description: "Grade 316 SS, 50mm length" },
    ],
    assignedVendorIds: ["v9"],
    status: "Closed", createdAt: "2026-05-25",
  },
  {
    id: "r7", title: "Stationery & Office Supplies — Gandhinagar HQ", category: "Stationery",
    deadline: "2026-06-25",
    items: [
      { name: "A4 Copier Paper (500 sheets)", qty: 200, description: "75 GSM, JK Copier or equivalent" },
      { name: "Ball Pen Box (10 pcs)", qty: 100, description: "Blue ink, Reynolds or Cello brand" },
      { name: "File Folder Plastic", qty: 150, description: "L-shaped, assorted colours" },
    ],
    assignedVendorIds: ["v10", "v4"],
    status: "Open", createdAt: "2026-06-02",
  },
];

const seedQuotations: Quotation[] = [
  { id: "q1", rfqId: "r1", vendorId: "v1", lines: [{ item: "Ergonomic Chair", qty: 25, unitPrice: 3600 }, { item: "Standing Desk", qty: 10, unitPrice: 9200 }], deliveryDays: 14, submittedAt: "2026-05-25", status: "Submitted" },
  { id: "q2", rfqId: "r1", vendorId: "v5", lines: [{ item: "Ergonomic Chair", qty: 25, unitPrice: 3850 }, { item: "Standing Desk", qty: 10, unitPrice: 8900 }], deliveryDays: 18, submittedAt: "2026-05-26", status: "Submitted" },
  { id: "q3", rfqId: "r2", vendorId: "v2", lines: [{ item: "Laptop 16GB", qty: 40, unitPrice: 68000 }], deliveryDays: 21, submittedAt: "2026-05-30", status: "Submitted" },
  // Gujarat-based quotations
  { id: "q4", rfqId: "r3", vendorId: "v6", lines: [{ item: "Desktop PC Core i5", qty: 20, unitPrice: 42500 }, { item: "24-inch Monitor", qty: 20, unitPrice: 11200 }], deliveryDays: 10, notes: "Includes 1-year onsite warranty", submittedAt: "2026-06-05", status: "Selected" },
  { id: "q5", rfqId: "r4", vendorId: "v7", lines: [{ item: "Cotton Drill Fabric", qty: 500, unitPrice: 185 }, { item: "Reflective Safety Vest", qty: 150, unitPrice: 420 }], deliveryDays: 7, notes: "Fabric sourced from GPCL-approved mill, Surat", submittedAt: "2026-06-05", status: "Submitted" },
  { id: "q6", rfqId: "r5", vendorId: "v8", lines: [{ item: "Rotary Screw Compressor 10HP", qty: 3, unitPrice: 125000 }, { item: "Air Dryer Unit", qty: 3, unitPrice: 38000 }], deliveryDays: 21, notes: "Atlas Copco authorised dealer, Vadodara", submittedAt: "2026-06-06", status: "Submitted" },
  { id: "q7", rfqId: "r6", vendorId: "v9", lines: [{ item: "Mild Steel Flange (DN50)", qty: 80, unitPrice: 680 }, { item: "Stainless Hex Bolt M12", qty: 500, unitPrice: 28 }], deliveryDays: 5, notes: "Material test certificates included", submittedAt: "2026-05-28", status: "Selected" },
  { id: "q8", rfqId: "r7", vendorId: "v10", lines: [{ item: "A4 Copier Paper (500 sheets)", qty: 200, unitPrice: 320 }, { item: "Ball Pen Box (10 pcs)", qty: 100, unitPrice: 95 }, { item: "File Folder Plastic", qty: 150, unitPrice: 25 }], deliveryDays: 3, notes: "GST invoice provided; delivery to Sector 11, Gandhinagar", submittedAt: "2026-06-04", status: "Submitted" },
];

const seedApprovals: Approval[] = [
  { id: "a1", quotationId: "q1", state: "Under Review", approver: "Priya Shah", updatedAt: "2026-06-01" },
  { id: "a2", quotationId: "q3", state: "Pending", updatedAt: "2026-06-02" },
  // Gujarat-based approvals
  { id: "a3", quotationId: "q4", state: "Approved", approver: "Dhruv Patel", remarks: "Best price-to-spec ratio; proceed with PO", updatedAt: "2026-06-06" },
  { id: "a4", quotationId: "q7", state: "Approved", approver: "Meenaben Desai", remarks: "Delivery timeline acceptable; material certs on file", updatedAt: "2026-05-30" },
  { id: "a5", quotationId: "q5", state: "Under Review", approver: "Jignesh Solanki", remarks: "Awaiting fabric swatch sample verification", updatedAt: "2026-06-06" },
  { id: "a6", quotationId: "q6", state: "Pending", updatedAt: "2026-06-06" },
  { id: "a7", quotationId: "q8", state: "Approved", approver: "Hiral Bhatt", remarks: "Routine stationery replenishment; approved as per SOP", updatedAt: "2026-06-05" },
];

const seedDocs: PurchaseDoc[] = [
  { id: "d1", poNumber: "PO-2026-0061", quotationId: "q1", vendorId: "v1", date: "2026-05-21", status: "Pending Payment" },
  // Gujarat-based purchase documents
  { id: "d2", poNumber: "PO-2026-0074", quotationId: "q4", vendorId: "v6", date: "2026-06-06", status: "Pending Payment" },
  { id: "d3", poNumber: "PO-2026-0058", quotationId: "q7", vendorId: "v9", date: "2026-05-30", status: "Paid" },
  { id: "d4", poNumber: "PO-2026-0071", quotationId: "q8", vendorId: "v10", date: "2026-06-05", status: "Paid" },
];

const seedLogs: ActivityLog[] = [
  { id: "l1", type: "quotation", message: "Quotation submitted — Infra Supplies Pvt Ltd selected for Office Furniture Q2", timestamp: "2026-06-02T16:15:00Z" },
  { id: "l2", type: "approval", message: "Approval pending — PO-2026 awaiting L2 approval by Priya Shah", timestamp: "2026-06-02T14:55:00Z" },
  { id: "l3", type: "rfq", message: "RFQ published — Office Furniture Q2 sent to 3 vendors", timestamp: "2026-05-20T11:00:00Z" },
  { id: "l4", type: "vendor", message: "Vendor added — FastLog Logistics registered and pending verification", timestamp: "2026-05-18T09:20:00Z" },
  // Gujarat-based activity logs
  { id: "l5", type: "vendor", message: "Vendor registered — Akshar Infotech Solutions, Ahmedabad (IT Hardware) verified and activated", timestamp: "2026-06-01T10:30:00Z" },
  { id: "l6", type: "rfq", message: "RFQ published — Desktop Computers for Ahmedabad Branch sent to 2 vendors", timestamp: "2026-06-01T11:45:00Z" },
  { id: "l7", type: "approval", message: "Quotation approved — Akshar Infotech Solutions selected for Ahmedabad Desktop procurement; PO-2026-0074 raised", timestamp: "2026-06-06T09:15:00Z" },
  { id: "l8", type: "po", message: "PO paid — PO-2026-0058 settled; Rajkot Precision Engineering delivered CNC parts to Rajkot Unit", timestamp: "2026-05-30T15:00:00Z" },
  { id: "l9", type: "rfq", message: "RFQ published — Stationery & Office Supplies for Gandhinagar HQ assigned to Gandhinagar Office Essentials", timestamp: "2026-06-02T08:55:00Z" },
  { id: "l10", type: "approval", message: "Approval under review — Surat Textile Traders fabric quotation pending swatch verification by Jignesh Solanki", timestamp: "2026-06-06T12:00:00Z" },
];

const seedProfiles: Profile[] = [
  { id: "p1", firstName: "Akshat", email: "akshat@vendorbridge.app", phone: "+91 90000 00001", role: "Procurement Officer", country: "India", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop" },
  // Gujarat-based profiles
  { id: "p2", firstName: "Dhruv Patel", email: "dhruv.patel@vendorbridge.app", phone: "+91 98250 67891", role: "Manager", country: "India", notes: "Operations Manager — Ahmedabad Regional Office", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&fit=crop" },
  { id: "p3", firstName: "Meenaben Desai", email: "meena.desai@vendorbridge.app", phone: "+91 97250 34567", role: "Admin", country: "India", notes: "Senior Admin — Vadodara Plant", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&fit=crop" },
  { id: "p4", firstName: "Jignesh Solanki", email: "jignesh.solanki@vendorbridge.app", phone: "+91 96670 11223", role: "Procurement Officer", country: "India", notes: "Procurement Officer — Surat Textile Division", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&fit=crop" },
  { id: "p5", firstName: "Hiral Bhatt", email: "hiral.bhatt@vendorbridge.app", phone: "+91 93745 99001", role: "Procurement Officer", country: "India", notes: "Procurement Officer — Gandhinagar HQ", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&fit=crop" },
  { id: "p6", firstName: "Nikunj Mehta", email: "nikunj.mehta@vendorbridge.app", phone: "+91 99797 55432", role: "Vendor", country: "India", notes: "Vendor Representative — Rajkot Precision Engineering", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&fit=crop" },
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

      if (supabase) {
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
          if (error) {
            console.error("Supabase vendor insert error:", error);
            throw error;
          }
          console.log("Vendor inserted to Supabase successfully:", newId);
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
    addRFQ: async (r) => {
      const newId = uid();
      const mappedRFQ: RFQ = { ...r, id: newId, createdAt: now(), status: "Open" };
      setRFQs((p) => [mappedRFQ, ...p]);

      if (supabase) {
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
          if (error) {
            console.error("Supabase RFQ insert error:", error);
            throw error;
          }
          console.log("RFQ inserted to Supabase successfully:", newId);
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

      if (supabase) {
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
          if (error) {
            console.error("Supabase quotation insert error:", error);
            throw error;
          }
          console.log("Quotation inserted to Supabase successfully:", newId);
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
    updateApproval: async (id, patch) => {
      setApprovals((p) => p.map((a) => a.id === id ? { ...a, ...patch, updatedAt: now() } : a));

      if (supabase) {
        try {
          const dbStatus = patch.state === "Approved" ? "Approved" : patch.state === "Rejected" ? "Rejected" : "Pending";
          const { error } = await supabase.from("approvals").update({
            status: dbStatus,
            remarks: patch.remarks
          }).eq("id", id);
          if (error) {
            console.error("Supabase approval update error:", error);
            throw error;
          }
          console.log("Approval updated in Supabase successfully:", id);
        } catch (e) {
          console.warn("Supabase update failed, local state updated:", e);
        }
      }
    },
    addProfile: async (p) => {
      const newId = uid();
      const mappedProfile: Profile = { ...p, id: newId };
      setProfiles((arr) => [mappedProfile, ...arr]);

      if (supabase) {
        try {
          const { error } = await supabase.from("profiles").insert({
            id: newId,
            first_name: p.firstName,
            email: p.email,
            role: p.role,
            phone_number: p.phone,
            country: p.country
          });
          if (error) {
            console.error("Supabase profile insert error:", error);
            throw error;
          }
          console.log("Profile inserted to Supabase successfully:", newId);
        } catch (e) {
          console.warn("Supabase insert failed, local state updated:", e);
        }
      }
    },
    log: async (l) => {
      const newId = uid();
      const mappedLog: ActivityLog = { ...l, id: newId, timestamp: now() };
      setLogs((p) => [mappedLog, ...p]);

      if (supabase) {
        try {
          const { error } = await supabase.from("activity_logs").insert({
            id: newId,
            action: l.type,
            details: l.message
          });
          if (error) {
            console.error("Supabase log insert error:", error);
            throw error;
          }
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
