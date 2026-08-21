/**
 * Professional document PDF generator for PrintVerse Technologies.
 * Generates both QUOTATION (with red DUE stamp) and INVOICE (clean, locked).
 * Uses @react-pdf/renderer — must run on Node.js runtime only.
 */

export const runtime = "nodejs";

import type { Quotation } from "@/types";
import * as fs from "fs";
import * as path from "path";

function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

function formatINR(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function generateDocumentPDF(quotation: Quotation): Promise<Buffer> {
  const {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    renderToBuffer,
  } = await import("@react-pdf/renderer");

  const isInvoice = quotation.doc_type === "invoice";
  const docTitle = isInvoice ? "INVOICE" : "QUOTATION";
  const docNumber = isInvoice
    ? `INV-${quotation.tracking_id}`
    : `QT-${quotation.tracking_id}`;

  const logoBase64 = getLogoBase64();

  // ── Colour palette ────────────────────────────────────────────────────────
  const NAVY = "#0B1F4D";
  const GOLD = "#D4A017";
  const RED = "#C41E2C";
  const SLATE = "#64748b";
  const BORDER = "#e2e8f0";
  const BG_LIGHT = "#f8f9fb";
  const WHITE = "#ffffff";

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      backgroundColor: WHITE,
      paddingTop: 0,
      paddingBottom: 50,
      paddingHorizontal: 0,
      fontSize: 10,
      color: NAVY,
    },

    // ── Header band ─────────────────────────────────────────────────────
    headerBand: {
      backgroundColor: NAVY,
      paddingHorizontal: 36,
      paddingTop: 28,
      paddingBottom: 28,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    logo: {
      width: 48,
      height: 48,
      objectFit: "contain",
    },
    companyBlock: {
      flexDirection: "column",
      gap: 2,
    },
    companyName: {
      color: GOLD,
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 0.5,
    },
    companyTagline: {
      color: "#94a3b8",
      fontSize: 8.5,
      marginTop: 1,
    },
    companyContact: {
      color: "#94a3b8",
      fontSize: 8,
    },
    docBadge: {
      backgroundColor: isInvoice ? GOLD : RED,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 6,
    },
    docBadgeText: {
      color: WHITE,
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 2,
    },

    // ── Gold accent strip ──────────────────────────────────────────────
    accentStrip: {
      height: 3,
      backgroundColor: GOLD,
    },

    // ── Document number row ────────────────────────────────────────────
    docNumberRow: {
      backgroundColor: BG_LIGHT,
      paddingHorizontal: 36,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    docNumberLabel: {
      fontSize: 8,
      color: SLATE,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    docNumberValue: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: NAVY,
      letterSpacing: 2,
    },
    docDateBlock: {
      alignItems: "flex-end",
      gap: 2,
    },
    docDateRow: {
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
    },
    docDateLabel: {
      fontSize: 8,
      color: SLATE,
    },
    docDateValue: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: NAVY,
    },

    // ── Bill-to / Doc info two-column ──────────────────────────────────
    billSection: {
      flexDirection: "row",
      paddingHorizontal: 36,
      paddingVertical: 20,
      gap: 0,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    billToCol: {
      flex: 1,
      paddingRight: 20,
    },
    billSectionLabel: {
      fontSize: 8,
      color: SLATE,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      fontFamily: "Helvetica-Bold",
    },
    billName: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: NAVY,
      marginBottom: 3,
    },
    billDetail: {
      fontSize: 9,
      color: SLATE,
      marginBottom: 2,
    },
    billAddress: {
      fontSize: 9,
      color: SLATE,
      lineHeight: 1.5,
    },

    // ── Items table ────────────────────────────────────────────────────
    tableWrapper: {
      paddingHorizontal: 36,
      marginTop: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: NAVY,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 6,
      marginBottom: 0,
    },
    th: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: GOLD,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    colNo: { width: 28 },
    colDesc: { flex: 1 },
    colQty: { width: 40, textAlign: "right" },
    colRate: { width: 70, textAlign: "right" },
    colAmt: { width: 80, textAlign: "right" },

    tableRow: {
      flexDirection: "row",
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    tableRowAlt: {
      backgroundColor: BG_LIGHT,
    },
    td: {
      fontSize: 9.5,
      color: NAVY,
    },
    tdMuted: {
      fontSize: 9.5,
      color: SLATE,
    },

    // ── Totals block ───────────────────────────────────────────────────
    totalsWrapper: {
      paddingHorizontal: 36,
      marginTop: 12,
      alignItems: "flex-end",
    },
    totalsBox: {
      width: 260,
      gap: 0,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    totalLabel: {
      fontSize: 9,
      color: SLATE,
    },
    totalValue: {
      fontSize: 9.5,
      fontFamily: "Helvetica-Bold",
      color: NAVY,
    },
    discountValue: {
      fontSize: 9.5,
      fontFamily: "Helvetica-Bold",
      color: RED,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: NAVY,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 6,
      marginTop: 6,
    },
    grandTotalLabel: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: GOLD,
    },
    grandTotalValue: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: WHITE,
    },

    // ── DUE watermark stamp ────────────────────────────────────────────
    stampWrapper: {
      position: "absolute",
      top: 260,
      right: 50,
      transform: "rotate(-35deg)",
      opacity: 0.12,
      borderWidth: 6,
      borderColor: RED,
      borderRadius: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    stampText: {
      fontSize: 52,
      fontFamily: "Helvetica-Bold",
      color: RED,
      letterSpacing: 6,
    },

    // ── Notes section ──────────────────────────────────────────────────
    notesSection: {
      paddingHorizontal: 36,
      marginTop: 20,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: BORDER,
    },
    notesLabel: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: SLATE,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 5,
    },
    notesText: {
      fontSize: 9,
      color: SLATE,
      lineHeight: 1.6,
    },

    // ── Computer-generated notice ───────────────────────────────────
    cgNotice: {
      marginHorizontal: 36,
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: BG_LIGHT,
    },
    cgNoticeText: {
      fontSize: 8,
      color: SLATE,
      fontFamily: "Helvetica-Oblique",
      flex: 1,
    },
    cgNoticeBold: {
      fontFamily: "Helvetica-Bold",
      color: NAVY,
    },

    // ── Footer ─────────────────────────────────────────────────────────
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: NAVY,
      paddingVertical: 10,
      paddingHorizontal: 36,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerLeft: {
      fontSize: 8,
      color: "#94a3b8",
    },
    footerRight: {
      fontSize: 8,
      color: GOLD,
    },
  });

  const InvoiceDoc = () => (
    <Document
      title={`PrintVerse ${docTitle} ${docNumber}`}
      author="PrintVerse Technologies"
      subject={docTitle}
    >
      <Page size="A4" style={styles.page}>

        {/* ── DUE stamp (quotation only) ─────────────────────────── */}
        {!isInvoice && (
          <View style={styles.stampWrapper} fixed>
            <Text style={styles.stampText}>DUE</Text>
          </View>
        )}

        {/* ── Header band ──────────────────────────────────────────── */}
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            {logoBase64 ? (
              <Image style={styles.logo} src={logoBase64} />
            ) : null}
            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>PrintVerse Technologies</Text>
              <Text style={styles.companyTagline}>Where Every Idea Takes Shape</Text>
              <Text style={styles.companyContact}>
                IIFR Lab, IEM Kolkata
              </Text>
            </View>
          </View>
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>{docTitle}</Text>
          </View>
        </View>

        {/* ── Gold accent strip ─────────────────────────────────────── */}
        <View style={styles.accentStrip} />

        {/* ── Document number row ───────────────────────────────────── */}
        <View style={styles.docNumberRow}>
          <View>
            <Text style={styles.docNumberLabel}>Document Number</Text>
            <Text style={styles.docNumberValue}>{docNumber}</Text>
          </View>
          <View style={styles.docDateBlock}>
            <View style={styles.docDateRow}>
              <Text style={styles.docDateLabel}>Issue Date:</Text>
              <Text style={styles.docDateValue}>
                {formatDisplayDate(quotation.issue_date)}
              </Text>
            </View>
            {quotation.valid_until && !isInvoice && (
              <View style={styles.docDateRow}>
                <Text style={styles.docDateLabel}>Valid Until:</Text>
                <Text style={styles.docDateValue}>
                  {formatDisplayDate(quotation.valid_until)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Bill To section ───────────────────────────────────────── */}
        <View style={styles.billSection}>
          <View style={styles.billToCol}>
            <Text style={styles.billSectionLabel}>Bill To</Text>
            <Text style={styles.billName}>{quotation.customer_name}</Text>
            <Text style={styles.billDetail}>{quotation.customer_email}</Text>
            <Text style={styles.billDetail}>{quotation.customer_phone}</Text>
            {quotation.customer_address ? (
              <Text style={styles.billAddress}>{quotation.customer_address}</Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.billSectionLabel}>From</Text>
            <Text style={styles.billName}>PrintVerse Technologies</Text>
            <Text style={styles.billDetail}>IIFR Lab, IEM Kolkata</Text>
            <Text style={styles.billDetail}>West Bengal, India</Text>
          </View>
        </View>

        {/* ── Items table ───────────────────────────────────────────── */}
        <View style={styles.tableWrapper}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNo]}>#</Text>
            <Text style={[styles.th, styles.colDesc]}>Description / Particulars</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colRate]}>Rate</Text>
            <Text style={[styles.th, styles.colAmt]}>Amount</Text>
          </View>

          {/* Table rows */}
          {quotation.items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.td, styles.colNo]}>{idx + 1}</Text>
              <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.tdMuted, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tdMuted, styles.colRate]}>
                {formatINR(item.rate)}
              </Text>
              <Text style={[styles.td, styles.colAmt]}>
                {formatINR(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totals block ──────────────────────────────────────────── */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatINR(quotation.subtotal)}</Text>
            </View>

            {quotation.discount_type !== "none" && quotation.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Discount
                  {quotation.discount_type === "percentage"
                    ? ` (${quotation.discount_value}%)`
                    : " (Fixed)"}
                </Text>
                <Text style={styles.discountValue}>
                  - {formatINR(quotation.discount_amount)}
                </Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>
                {isInvoice ? "TOTAL PAID" : "TOTAL PAYABLE"}
              </Text>
              <Text style={styles.grandTotalValue}>{formatINR(quotation.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Terms & Conditions ──────────────────────────────────────── */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Terms & Conditions</Text>
          <Text style={styles.notesText}>
            {(quotation.notes ?? "").trim()
              ? quotation.notes!
              : `1. All prices are inclusive of material and printing charges only. Delivery charges are billed separately.\n2. This ${isInvoice ? "invoice is a final billing document" : "quotation is valid until the date mentioned above; prices may be revised after expiry"}.\n3. Orders are confirmed only after receipt of full payment.\n4. Customisation changes after order confirmation may attract additional charges.\n5. PrintVerse Technologies is not liable for design errors submitted by the customer.\n6. In case of any dispute, jurisdiction shall be subject to courts in Kolkata, West Bengal, India.`
            }
          </Text>
        </View>

        {/* ── Computer-generated notice ─────────────────────────────── */}
        <View style={styles.cgNotice}>
          <Text style={styles.cgNoticeText}>
            <Text style={styles.cgNoticeBold}>This is a computer-generated document.</Text>
            {"  "}
            No physical signature is required. This document is valid without signature or stamp and is generated by the PrintVerse Technologies billing system.
          </Text>
        </View>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>
            PrintVerse Technologies · IIFR Lab, IEM Kolkata · India
          </Text>
          <Text style={styles.footerRight}>
            {quotation.order_id === "offline"
              ? docNumber
              : `${docNumber} · Tracking #${quotation.tracking_id}`}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(<InvoiceDoc />);
}
