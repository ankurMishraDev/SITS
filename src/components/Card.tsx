import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  rightText?: string;
  rightSubtext?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  leftIcon?: React.ReactNode;
  accentColor?: string;
}

export function ListItem({
  title,
  subtitle,
  rightText,
  rightSubtext,
  onPress,
  onEdit,
  onDelete,
  leftIcon,
  accentColor,
}: ListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.listItem, accentColor && { borderLeftColor: accentColor, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={styles.listItemRight}>
        {rightText && <Text style={styles.rightText}>{rightText}</Text>}
        {rightSubtext && <Text style={styles.rightSubtext}>{rightSubtext}</Text>}
      </View>
      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Ionicons name="pencil" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Ionicons name="trash" size={18} color={Colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {onPress && !onEdit && !onDelete && (
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItem: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  leftIcon: {
    marginRight: Spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  listItemSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listItemRight: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  rightText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  rightSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
});
