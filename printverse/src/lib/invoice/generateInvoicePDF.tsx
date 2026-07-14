/**
 * Invoice PDF generator using @react-pdf/renderer.
 * Must be a .tsx file because it uses JSX.
 * Must run on Node.js runtime only (not Edge).
 */

export const runtime = "nodejs";

export async function generateInvoicePDF(
  order: Record<string, unknown>
): Promise<Buffer> {
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } =
    await import("@react-pdf/renderer");

  const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
    header: { backgroundColor: "#0B1F4D", padding: 24, marginBottom: 24, borderRadius: 8 },
    headerTitle: { color: "#D4A017", fontSize: 22, fontFamily: "Helvetica-Bold" },
    headerSub: { color: "#94a3b8", fontSize: 10, marginTop: 4 },
    section: { marginBottom: 20 },
    label: { fontSize: 9, color: "#64748b", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 },
    value: { fontSize: 12, color: "#0B1F4D", fontFamily: "Helvetica-Bold" },
    row: {
      flexDirection: "row", justifyContent: "space-between",
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
    },
    totalRow: {
      flexDirection: "row", justifyContent: "space-between",
      backgroundColor: "#0B1F4D", padding: 12, borderRadius: 8, marginTop: 8,
    },
    totalLabel: { color: "#D4A017", fontSize: 14, fontFamily: "Helvetica-Bold" },
    totalValue: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" },
    footer: {
      position: "absolute", bottom: 30, left: 40, right: 40,
      borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12,
    },
    footerText: { fontSize: 9, color: "#94a3b8", textAlign: "center" },
    trackingBadge: { backgroundColor: "#f0f4ff", padding: 12, borderRadius: 8, marginBottom: 20 },
    trackingLabel: { fontSize: 9, color: "#64748b", marginBottom: 4, textTransform: "uppercase" },
    trackingId: { fontSize: 28, color: "#0B1F4D", fontFamily: "Helvetica-Bold", letterSpacing: 4 },
  });

  const qty = order.quantity as number;
  const subtotal = order.subtotal as number;
  const deliveryCharge = order.delivery_charge as number;
  const totalAmount = order.total_amount as number;
  const productName =
    (order.products as { name: string } | null)?.name ?? "Custom 3D Print";

  const InvoiceDoc = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PrintVerse Technologies</Text>
          <Text style={styles.headerSub}>
            Where Every Idea Takes Shape · IIFR Lab, IEM Kolkata
          </Text>
        </View>

        <View style={styles.trackingBadge}>
          <Text style={styles.trackingLabel}>Tracking ID</Text>
          <Text style={styles.trackingId}>{order.tracking_id as string}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{order.customer_name as string}</Text>
            </View>
            <View>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{new Date().toLocaleDateString("en-IN")}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{order.email as string}</Text>
            </View>
            <View>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{order.phone as string}</Text>
            </View>
          </View>
          {(order.delivery_city as string | null) && (
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Delivery Address</Text>
                <Text style={styles.value}>
                  {order.delivery_address_line as string},{" "}
                  {order.delivery_city as string},{" "}
                  {order.delivery_state as string} — {order.delivery_pincode as string}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={{ ...styles.label, flex: 3 }}>Item</Text>
            <Text style={{ ...styles.label, flex: 1, textAlign: "right" }}>Qty</Text>
            <Text style={{ ...styles.label, flex: 1, textAlign: "right" }}>Unit Price</Text>
            <Text style={{ ...styles.label, flex: 1, textAlign: "right" }}>Total</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ flex: 3, fontSize: 11, color: "#0B1F4D" }}>{productName}</Text>
            <Text style={{ flex: 1, fontSize: 11, color: "#0B1F4D", textAlign: "right" }}>{qty}</Text>
            <Text style={{ flex: 1, fontSize: 11, color: "#0B1F4D", textAlign: "right" }}>
              ₹{(subtotal / qty).toFixed(2)}
            </Text>
            <Text style={{ flex: 1, fontSize: 11, color: "#0B1F4D", textAlign: "right" }}>
              ₹{subtotal.toFixed(2)}
            </Text>
          </View>
          {deliveryCharge > 0 && (
            <View style={styles.row}>
              <Text style={{ flex: 3, fontSize: 11, color: "#64748b" }}>Delivery (India Post)</Text>
              <Text style={{ flex: 1, fontSize: 11, color: "#64748b", textAlign: "right" }}>1</Text>
              <Text style={{ flex: 1, fontSize: 11, color: "#64748b", textAlign: "right" }}>
                ₹{deliveryCharge.toFixed(2)}
              </Text>
              <Text style={{ flex: 1, fontSize: 11, color: "#64748b", textAlign: "right" }}>
                ₹{deliveryCharge.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PrintVerse Technologies · IIFR Lab, IEM Kolkata · Delivery via India Post · ₹4/gram (50g minimum)
          </Text>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(<InvoiceDoc />);
}
