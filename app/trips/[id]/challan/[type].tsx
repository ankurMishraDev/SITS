import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../src/constants/theme';
import { Loading } from '../../../../src/components';
import { 
  useTrip, 
  useTripBalances,
  useAdvances,
  useCharges,
  useBalancePayments,
} from '../../../../src/hooks';

export default function ChallanScreen() {
  const params = useLocalSearchParams<{ id: string; type: 'party' | 'supplier' }>();
  const { id, type } = params;
  const [downloading, setDownloading] = useState(false);

  const { data: trip, isLoading } = useTrip(id);
  const { data: balances } = useTripBalances(id);
  const { data: advances } = useAdvances(id, type);
  const { data: charges } = useCharges(id, type);
  const { data: balancePayments } = useBalancePayments(id, type);

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
    if (!trip) return '';

    const isParty = type === 'party';
    const entityName = isParty ? trip.party.name : trip.vehicle.supplier.name;
    const entityContact = isParty ? trip.party.contact_no : trip.vehicle.supplier.contact_no;
    const freightAmount = isParty ? trip.freight_party : trip.freight_supplier;
    const balanceRemaining = isParty ? balances?.party_balance_remaining : balances?.supplier_balance_remaining;

    const totalAdvances = advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0;
    const totalCharges = charges?.reduce((sum, chg) => sum + chg.amount, 0) || 0;
    const totalBalancePayments = balancePayments?.reduce((sum, pmt) => sum + pmt.amount, 0) || 0;

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
              border: 2px solid ${isParty ? '#3b82f6' : '#10b981'};
              border-radius: 8px;
              padding: 20px;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              padding-bottom: 15px; 
              border-bottom: 2px solid ${isParty ? '#3b82f6' : '#10b981'};
              margin-bottom: 15px;
            }
            .logo { 
              border: 2px solid ${isParty ? '#3b82f6' : '#10b981'}; 
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
            .challan-header { 
              background: ${isParty ? '#3b82f6' : '#10b981'}; 
              color: #fff; 
              padding: 10px 15px; 
              border-radius: 4px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            .challan-title { 
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
            .entity-name { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .entity-contact { 
              font-size: 12px; 
              color: #666;
            }
            .trip-id { 
              font-size: 13px; 
              font-weight: 600; 
              color: ${isParty ? '#3b82f6' : '#10b981'};
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
              color: ${isParty ? '#3b82f6' : '#10b981'};
            }
            .trip-meta { 
              font-size: 10px; 
              color: #666; 
              line-height: 1.5;
            }
            .financial-section { margin-bottom: 15px; }
            .financial-header { 
              background: ${isParty ? '#3b82f6' : '#10b981'}; 
              color: #fff; 
              padding: 8px 15px; 
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .financial-table { 
              background: #f9fafb; 
              padding: 12px; 
              border-radius: 4px;
            }
            .financial-row { 
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
            .financial-label { 
              font-size: 12px; 
              font-weight: 600;
            }
            .financial-value { 
              font-size: 12px; 
              font-weight: 600;
            }
            .subsection-label { 
              font-size: 12px; 
              font-weight: 600; 
              color: #666;
            }
            .transaction-item { 
              display: flex; 
              justify-content: space-between; 
              padding: 6px 0 6px 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .transaction-date { 
              font-size: 10px; 
              color: #666;
              flex: 1;
            }
            .transaction-method { 
              font-size: 10px; 
              color: #666;
              margin-right: 10px;
            }
            .transaction-amount { 
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
              color: ${isParty ? '#3b82f6' : '#10b981'};
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

            <div class="challan-header">
              <div class="challan-title">${isParty ? 'Party' : 'Supplier'} Challan</div>
              <div class="generated-text">Generated on ${generatedDate} at ${generatedTime}</div>
            </div>

            <div class="details-row">
              <div class="section">
                <div class="section-title">${isParty ? 'Party Details' : 'Supplier Details'}</div>
                <div class="entity-name">${entityName}</div>
                <div class="entity-contact">+91 ${entityContact || 'N/A'}</div>
              </div>

              <div class="section">
                <div class="section-title">Trip Details</div>
                ${trip.lr_number ? `<div class="trip-id">LR No: ${trip.lr_number}</div>` : ''}
                
                <div class="route-info">
                  <div class="route-item">
                    <div class="route-label">${trip.origin}</div>
                    <div class="route-date">${formatDate(trip.date)}</div>
                  </div>
                  <div class="route-arrow">→</div>
                  <div class="route-item">
                    <div class="route-label">${trip.destination}</div>
                  </div>
                </div>

                <div class="trip-meta">
                  Vehicle: ${trip.vehicle.vehicle_no}<br/>
                  ${trip.material_desc ? `Material: ${trip.material_desc}<br/>` : ''}
                  Status: ${trip.status}
                </div>
              </div>
            </div>

            <div class="financial-section">
              <div class="financial-header">Financial Details</div>
              
              <div class="financial-table">
                <div class="financial-row">
                  <div class="financial-label">Freight Amount:</div>
                  <div class="financial-value">${formatCurrency(freightAmount)}</div>
                </div>

                ${advances && advances.length > 0 ? `
                  <div class="financial-row subsection-row">
                    <div class="subsection-label">Advances (-)</div>
                  </div>
                  ${advances.map(adv => `
                    <div class="transaction-item">
                      <div class="transaction-date">${formatDate(adv.received_date)}</div>
                      <div class="transaction-method">${adv.payment_mode}</div>
                      <div class="transaction-amount">-${formatCurrency(adv.amount)}</div>
                    </div>
                  `).join('')}
                ` : ''}

                ${charges && charges.length > 0 ? `
                  <div class="financial-row subsection-row">
                    <div class="subsection-label">Charges (+)</div>
                  </div>
                  ${charges.map(chg => `
                    <div class="transaction-item">
                      <div class="transaction-date">${chg.description}</div>
                      <div class="transaction-method">${formatDate(chg.date)}</div>
                      <div class="transaction-amount">+${formatCurrency(chg.amount)}</div>
                    </div>
                  `).join('')}
                ` : ''}

                ${balancePayments && balancePayments.length > 0 ? `
                  <div class="financial-row subsection-row">
                    <div class="subsection-label">Balance Payments (-)</div>
                  </div>
                  ${balancePayments.map(pmt => `
                    <div class="transaction-item">
                      <div class="transaction-date">${formatDate(pmt.received_date)}</div>
                      <div class="transaction-method">${pmt.payment_mode}</div>
                      <div class="transaction-amount">-${formatCurrency(pmt.amount)}</div>
                    </div>
                  `).join('')}
                ` : ''}

                <div class="financial-row total-row">
                  <div class="total-label">Balance Remaining</div>
                  <div class="total-value">${formatCurrency(balanceRemaining || 0)}</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-text">
                This is an automatically generated challan. Powered by Transportikart
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!trip) return;

    try {
      setDownloading(true);
      const html = generateHTML();
      
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${type === 'party' ? 'Party' : 'Supplier'} Challan - ${trip.party.name}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Challan PDF generated successfully!');
      }
    } catch (error) {
      console.error('Error generating challan PDF:', error);
      Alert.alert('Error', 'Failed to generate challan PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || !trip) {
    return <Loading />;
  }

  const isParty = type === 'party';
  const entityName = isParty ? trip.party.name : trip.vehicle.supplier.name;
  const entityContact = isParty ? trip.party.contact_no : trip.vehicle.supplier.contact_no;
  const freightAmount = isParty ? trip.freight_party : trip.freight_supplier;
  const balanceRemaining = isParty ? balances?.party_balance_remaining : balances?.supplier_balance_remaining;

  const totalAdvances = advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0;
  const totalCharges = charges?.reduce((sum, chg) => sum + chg.amount, 0) || 0;
  const totalBalancePayments = balancePayments?.reduce((sum, pmt) => sum + pmt.amount, 0) || 0;

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
          title: `${isParty ? 'Party' : 'Supplier'} Challan`,
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
        <View style={[styles.challanContainer, { borderColor: isParty ? Colors.partyColor : Colors.supplierColor }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isParty ? Colors.partyColor : Colors.supplierColor }]}>
            <View style={styles.logo}>
              <View style={[styles.logoIcon, { borderColor: isParty ? Colors.partyColor : Colors.supplierColor }]}>
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

          {/* Challan Header */}
          <View style={[styles.challanHeader, { backgroundColor: isParty ? Colors.partyColor : Colors.supplierColor }]}>
            <Text style={styles.challanTitle}>{isParty ? 'Party' : 'Supplier'} Challan</Text>
            <Text style={styles.generatedText}>
              Generated on {generatedDate} at {generatedTime}
            </Text>
          </View>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isParty ? 'Party Details' : 'Supplier Details'}</Text>
              <Text style={styles.entityName}>{entityName}</Text>
              <Text style={styles.entityContact}>+91 {entityContact || 'N/A'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Details</Text>
              {trip.lr_number && (
                <Text style={[styles.tripId, { color: isParty ? Colors.partyColor : Colors.supplierColor }]}>
                  LR No: {trip.lr_number}
                </Text>
              )}
              
              <View style={styles.routeInfo}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>{trip.origin}</Text>
                  <Text style={styles.routeDate}>{formatDate(trip.date)}</Text>
                </View>
                <View style={styles.routeArrow}>
                  <Ionicons name="arrow-forward-circle" size={24} color={isParty ? Colors.partyColor : Colors.supplierColor} />
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>{trip.destination}</Text>
                </View>
              </View>

              <View style={styles.tripMeta}>
                <Text style={styles.metaText}>Vehicle: {trip.vehicle.vehicle_no}</Text>
                {trip.material_desc && (
                  <Text style={styles.metaText}>Material: {trip.material_desc}</Text>
                )}
                <Text style={styles.metaText}>Status: {trip.status}</Text>
              </View>
            </View>
          </View>

          {/* Financial Section */}
          <View style={styles.financialSection}>
            <Text style={[styles.financialHeader, { backgroundColor: isParty ? Colors.partyColor : Colors.supplierColor }]}>
              Financial Details
            </Text>
            
            <View style={styles.financialTable}>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Freight Amount:</Text>
                <Text style={styles.financialValue}>{formatCurrency(freightAmount)}</Text>
              </View>

              {advances && advances.length > 0 && (
                <>
                  <View style={[styles.financialRow, styles.subsectionRow]}>
                    <Text style={styles.subsectionLabel}>Advances (-)</Text>
                  </View>
                  {advances.map((adv, index) => (
                    <View key={index} style={styles.transactionItem}>
                      <Text style={styles.transactionDate}>{formatDate(adv.received_date)}</Text>
                      <Text style={styles.transactionMethod}>{adv.payment_mode}</Text>
                      <Text style={styles.transactionAmount}>-{formatCurrency(adv.amount)}</Text>
                    </View>
                  ))}
                </>
              )}

              {charges && charges.length > 0 && (
                <>
                  <View style={[styles.financialRow, styles.subsectionRow]}>
                    <Text style={styles.subsectionLabel}>Charges (+)</Text>
                  </View>
                  {charges.map((chg, index) => (
                    <View key={index} style={styles.transactionItem}>
                      <Text style={styles.transactionDate}>{chg.description}</Text>
                      <Text style={styles.transactionMethod}>{formatDate(chg.date)}</Text>
                      <Text style={styles.transactionAmount}>+{formatCurrency(chg.amount)}</Text>
                    </View>
                  ))}
                </>
              )}

              {balancePayments && balancePayments.length > 0 && (
                <>
                  <View style={[styles.financialRow, styles.subsectionRow]}>
                    <Text style={styles.subsectionLabel}>Balance Payments (-)</Text>
                  </View>
                  {balancePayments.map((pmt, index) => (
                    <View key={index} style={styles.transactionItem}>
                      <Text style={styles.transactionDate}>{formatDate(pmt.received_date)}</Text>
                      <Text style={styles.transactionMethod}>{pmt.payment_mode}</Text>
                      <Text style={styles.transactionAmount}>-{formatCurrency(pmt.amount)}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={[styles.financialRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Balance Remaining</Text>
                <Text style={[styles.totalValue, { color: isParty ? Colors.partyColor : Colors.supplierColor }]}>
                  {formatCurrency(balanceRemaining || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This is an automatically generated challan. Powered by Transportikart
            </Text>
          </View>

          {/* Download Button */}
          <TouchableOpacity 
            style={[styles.downloadButton, { backgroundColor: isParty ? Colors.partyColor : Colors.supplierColor }]}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Ionicons 
              name={downloading ? "hourglass-outline" : "download"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.downloadButtonText}>
              {downloading ? 'Generating PDF...' : 'Download Challan PDF'}
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
  challanContainer: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
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
    marginBottom: Spacing.md,
  },
  logo: {
    marginRight: Spacing.md,
  },
  logoIcon: {
    width: 80,
    padding: Spacing.sm,
    borderWidth: 2,
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
  challanHeader: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challanTitle: {
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
  section: {
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
  entityName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  entityContact: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tripId: {
    fontSize: FontSize.md,
    fontWeight: '600',
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
  financialSection: {
    marginBottom: Spacing.md,
  },
  financialHeader: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textInverse,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  financialTable: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  financialRow: {
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
  financialLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  financialValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  subsectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  transactionMethod: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  transactionAmount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
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
