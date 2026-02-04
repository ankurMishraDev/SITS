import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { Loading } from '../../src/components';
import { useLoadingSlip } from '../../src/hooks/useLoadingSlips';

export default function LoadingSlipDetailScreen() {
  const params = useLocalSearchParams();
  const { data: slip, loading } = useLoadingSlip(params.id as string);
  const [downloading, setDownloading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generateHTML = () => {
    const generatedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const generatedTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background: #fff;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              padding-bottom: 15px; 
              border-bottom: 2px solid #f59e0b;
              margin-bottom: 15px;
            }
            .logo { 
              border: 2px solid #f59e0b; 
              padding: 10px; 
              border-radius: 4px;
              text-align: center;
              min-width: 100px;
            }
            .logo-text { 
              font-size: 14px; 
              font-weight: bold; 
              color: #000;
            }
            .logo-subtext { 
              font-size: 10px; 
              font-weight: 600; 
              color: #666;
            }
            .company-info { flex: 1; margin-left: 15px; }
            .company-name { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 8px;
            }
            .company-address { 
              font-size: 10px; 
              color: #666; 
              line-height: 1.4;
              margin-bottom: 5px;
            }
            .pan-text { 
              font-size: 10px; 
              font-weight: 600;
            }
            .report-header { 
              background: #f59e0b; 
              color: #fff; 
              padding: 10px 15px; 
              border-radius: 4px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            .report-title { 
              font-size: 16px; 
              font-weight: bold;
            }
            .generated-text { 
              font-size: 9px;
            }
            .details-row { 
              display: flex; 
              gap: 15px; 
              margin-bottom: 15px;
            }
            .section { 
              flex: 1; 
              background: #f9fafb; 
              padding: 12px; 
              border-radius: 4px;
            }
            .section-title { 
              font-size: 11px; 
              font-weight: 600; 
              color: #666; 
              margin-bottom: 8px;
            }
            .bill-to-name { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .bill-to-phone { 
              font-size: 12px; 
              color: #666;
            }
            .trip-id { 
              font-size: 13px; 
              font-weight: 600; 
              color: #3b82f6;
              margin-bottom: 8px;
            }
            .route-info { 
              display: flex; 
              align-items: center; 
              gap: 10px;
              margin-bottom: 8px;
            }
            .route-item { flex: 1; }
            .route-label { 
              font-size: 12px; 
              font-weight: 600;
            }
            .route-date { 
              font-size: 10px; 
              color: #666;
            }
            .route-arrow { 
              font-size: 20px; 
              color: #3b82f6;
            }
            .trip-meta { 
              font-size: 10px; 
              color: #666; 
              line-height: 1.5;
            }
            .payment-section { margin-bottom: 15px; }
            .payment-header { 
              background: #f59e0b; 
              color: #fff; 
              padding: 8px 15px; 
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .payment-table { 
              background: #f9fafb; 
              padding: 12px; 
              border-radius: 4px;
            }
            .payment-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 6px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .subsection-row { 
              background: #fff; 
              padding: 6px 8px;
              margin-top: 5px;
            }
            .payment-label { 
              font-size: 12px; 
              font-weight: 600;
            }
            .payment-value { 
              font-size: 12px; 
              font-weight: 600;
            }
            .subsection-label { 
              font-size: 12px; 
              font-weight: 600; 
              color: #666;
            }
            .payment-detail { 
              display: flex; 
              justify-content: space-between; 
              padding: 6px 0 6px 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .payment-detail-label { 
              font-size: 10px; 
              color: #666;
              flex: 1;
            }
            .payment-detail-value { 
              font-size: 10px; 
              color: #666;
              margin-right: 10px;
            }
            .payment-detail-amount { 
              font-size: 12px; 
              font-weight: 600;
            }
            .total-row { 
              border-top: 2px solid #e5e7eb; 
              border-bottom: none;
              margin-top: 5px;
              padding-top: 8px;
            }
            .total-label { 
              font-size: 14px; 
              font-weight: bold;
            }
            .total-value { 
              font-size: 16px; 
              font-weight: bold; 
              color: #f59e0b;
            }
            .footer { 
              padding-top: 15px; 
              border-top: 1px solid #e5e7eb;
              text-align: center;
            }
            .footer-text { 
              font-size: 9px; 
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <div class="logo-text">SUPER INDIA</div>
                <div class="logo-subtext">TR SERVICE</div>
              </div>
              <div class="company-info">
                <div class="company-name">SUPER INDIA TR. SERVICE</div>
                <div class="company-address">
                  (+91) 9808012813<br/>
                  OFFICE: 111 FIRST FLOOR SHOP 1<br/>
                  KATARIYA COMPLEX<br/>
                  RING ROAD DEWAS NAKA INDORE<br/>
                  Madhya Pradesh 452001
                </div>
                <div class="pan-text">PAN: ANKPM5898G</div>
              </div>
            </div>

            <div class="report-header">
              <div class="report-title">Trip Report</div>
              <div class="generated-text">Generated on ${generatedDate} at ${generatedTime}</div>
            </div>

            <div class="details-row">
              <div class="section">
                <div class="section-title">Bill To</div>
                <div class="bill-to-name">${slip?.party?.name || 'N/A'}</div>
                <div class="bill-to-phone">+91 ${slip?.party?.contact_no || 'N/A'}</div>
              </div>

              <div class="section">
                <div class="section-title">Trip Details</div>
                <div class="trip-id">Trip ID / LR No: LR-${slip?.lr_no}</div>
                
                <div class="route-info">
                  <div class="route-item">
                    <div class="route-label">${slip?.origin_place}</div>
                    <div class="route-date">${slip ? formatDate(slip.trip_date) : ''}</div>
                  </div>
                  <div class="route-arrow">→</div>
                  <div class="route-item">
                    <div class="route-label">${slip?.destination_place}</div>
                  </div>
                </div>

                <div class="trip-meta">
                  Truck: ${slip?.vehicle_no}<br/>
                  Trip Status: Started<br/>
                  ${slip?.material_description ? `Material: ${slip.material_description}` : ''}
                </div>
              </div>
            </div>

            <div class="payment-section">
              <div class="payment-header">Payment Details</div>
              
              <div class="payment-table">
                <div class="payment-row">
                  <div class="payment-label">Freight Amount:</div>
                  <div class="payment-value">${slip ? formatCurrency(slip.freight_amount) : '₹0'}</div>
                </div>

                <div class="payment-row subsection-row">
                  <div class="subsection-label">Advances (-)</div>
                </div>

                ${slip && slip.advance_amount > 0 ? `
                  <div class="payment-detail">
                    <div class="payment-detail-label">Via CASH</div>
                    <div class="payment-detail-value">On ${formatDate(slip.trip_date)}</div>
                    <div class="payment-detail-amount">+${formatCurrency(slip.advance_amount)}</div>
                  </div>
                ` : ''}

                <div class="payment-row total-row">
                  <div class="total-label">Total Pending Balance</div>
                  <div class="total-value">
                    ${slip ? formatCurrency(slip.freight_amount - slip.advance_amount) : '₹0'}
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-text">
                This is an automatically generated summary. Powered by Transportikart
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!slip) return;

    try {
      setDownloading(true);
      const html = generateHTML();
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Loading Slip - LR ${slip.lr_no}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !slip) {
    return <Loading />;
  }

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const generatedTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: slip?.lr_no ? `LR ${slip.lr_no}` : 'Loading Slip',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              style={{ marginRight: 10 }}
            >
              <Ionicons 
                name={downloading ? "hourglass-outline" : "download-outline"} 
                size={24} 
                color={downloading ? Colors.textSecondary : Colors.primary} 
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.pdfContainer}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>SUPER INDIA</Text>
                <Text style={styles.logoSubtext}>TR SERVICE</Text>
              </View>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>SUPER INDIA TR. SERVICE</Text>
              <Text style={styles.companyAddress}>
                (+91) 9808012813{'\n'}
                OFFICE: 111 FIRST FLOOR SHOP 1{'\n'}
                KATARIYA COMPLEX{'\n'}
                RING ROAD DEWAS NAKA INDORE{'\n'}
                Madhya Pradesh 452001
              </Text>
              <Text style={styles.panText}>PAN: ANKPM5898G</Text>
            </View>
          </View>

          {/* Trip Report Header */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Trip Report</Text>
            <Text style={styles.generatedText}>
              Generated on {generatedDate} at {generatedTime}
            </Text>
          </View>

          {/* Bill To and Trip Details */}
          <View style={styles.detailsRow}>
            <View style={styles.billToSection}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={styles.billToName}>{slip.party?.name || 'N/A'}</Text>
              <Text style={styles.billToPhone}>+91 {slip.party?.contact_no || 'N/A'}</Text>
            </View>

            <View style={styles.tripDetailsSection}>
              <Text style={styles.sectionTitle}>Trip Details</Text>
              <Text style={styles.tripId}>Trip ID / LR No: LR-{slip.lr_no}</Text>
              
              <View style={styles.routeInfo}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>{slip.origin_place}</Text>
                  <Text style={styles.routeDate}>{formatDate(slip.trip_date)}</Text>
                </View>
                <View style={styles.routeArrow}>
                  <Ionicons name="arrow-forward-circle" size={24} color={Colors.primary} />
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>{slip.destination_place}</Text>
                </View>
              </View>

              <View style={styles.tripMeta}>
                <Text style={styles.metaText}>Truck: {slip.vehicle_no}</Text>
                <Text style={styles.metaText}>Trip Status: Started</Text>
                {slip.material_description && (
                  <Text style={styles.metaText}>Material: {slip.material_description}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.paymentSection}>
            <Text style={styles.paymentHeader}>Payment Details</Text>
            
            <View style={styles.paymentTable}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Freight Amount:</Text>
                <Text style={styles.paymentValue}>{formatCurrency(slip.freight_amount)}</Text>
              </View>

              <View style={[styles.paymentRow, styles.subsectionRow]}>
                <Text style={styles.subsectionLabel}>Advances (-)</Text>
                <Text style={styles.subsectionValue}></Text>
              </View>

              {slip.advance_amount > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentDetailLabel}>Via CASH</Text>
                  <Text style={styles.paymentDetailValue}>
                    On  {formatDate(slip.trip_date)}
                  </Text>
                  <Text style={styles.paymentValue}>+{formatCurrency(slip.advance_amount)}</Text>
                </View>
              )}

              <View style={[styles.paymentRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Pending Balance</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(slip.freight_amount - slip.advance_amount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This is an automatically generated summary. Powered by Transportikart
            </Text>
          </View>

          {/* Download Button */}
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Ionicons 
              name={downloading ? "hourglass-outline" : "download"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.downloadButtonText}>
              {downloading ? 'Generating PDF...' : 'Download as PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pdfContainer: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.loadingSlipColor,
    marginBottom: Spacing.md,
  },
  logo: {
    marginRight: Spacing.md,
  },
  logoIcon: {
    width: 80,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.loadingSlipColor,
    borderRadius: BorderRadius.md,
  },
  logoText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  logoSubtext: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  companyAddress: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  panText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  reportHeader: {
    backgroundColor: Colors.loadingSlipColor,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  generatedText: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  billToSection: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  billToName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  billToPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tripDetailsSection: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  tripId: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  routeItem: {
    flex: 1,
  },
  routeLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  routeDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  routeArrow: {
    marginHorizontal: Spacing.xs,
  },
  tripMeta: {
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  paymentSection: {
    marginBottom: Spacing.md,
  },
  paymentHeader: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textInverse,
    backgroundColor: Colors.loadingSlipColor,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  paymentTable: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subsectionRow: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  paymentLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  paymentValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  subsectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  subsectionValue: {
    fontSize: FontSize.sm,
  },
  paymentDetailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    paddingLeft: Spacing.md,
  },
  paymentDetailValue: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.loadingSlipColor,
  },
  footer: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.md,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: Colors.loadingSlipColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  downloadButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: '#fff',
    },
});
