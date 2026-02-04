import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export interface TripFilters {
  partyId?: string;
  vehicleId?: string;
  lrNo?: string;
  date?: Date;
  month?: string; // Format: "YYYY-MM"
  podStatus?: 'uploaded' | 'not_uploaded';
  originPlace?: string;
  destinationPlace?: string;
}

interface FilterOption {
  key: keyof TripFilters;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'select' | 'date' | 'text' | 'month';
}

interface TripFilterBarProps {
  filters: TripFilters;
  onFilterPress: (filterKey: keyof TripFilters) => void;
  onClearFilters: () => void;
  excludeFilters?: (keyof TripFilters)[];
}

export function TripFilterBar({ filters, onFilterPress, onClearFilters, excludeFilters = [] }: TripFilterBarProps) {
  const allFilterOptions: FilterOption[] = [
    { key: 'partyId', label: 'Party', icon: 'business', type: 'select' },
    { key: 'vehicleId', label: 'Vehicle', icon: 'car', type: 'select' },
    { key: 'lrNo', label: 'LR No.', icon: 'document-text', type: 'text' },
    { key: 'date', label: 'Date', icon: 'calendar', type: 'date' },
    { key: 'month', label: 'Month', icon: 'calendar-outline', type: 'month' },
    { key: 'podStatus', label: 'POD Status', icon: 'camera', type: 'select' },
    { key: 'originPlace', label: 'Origin', icon: 'location', type: 'text' },
    { key: 'destinationPlace', label: 'Destination', icon: 'navigate', type: 'text' },
  ];
  
  const filterOptions = allFilterOptions.filter(option => !excludeFilters.includes(option.key));

  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof TripFilters] !== undefined && 
    filters[key as keyof TripFilters] !== null
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={onClearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All ({activeFiltersCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {filterOptions.map((option) => {
          const isActive = filters[option.key] !== undefined && filters[option.key] !== null;
          
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onFilterPress(option.key)}
            >
              <Ionicons 
                name={option.icon} 
                size={16} 
                color={isActive ? Colors.primary : Colors.textSecondary} 
              />
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {option.label}
              </Text>
              {isActive && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearButtonText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  filtersScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
