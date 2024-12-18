import * as React from "react";
import { View, ViewProps } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

interface CardProps extends ViewProps {
    children: React.ReactNode;
}

interface CardHeaderProps extends ViewProps {
    children: React.ReactNode;
}

interface CardTitleProps extends ViewProps {
    children: React.ReactNode;
}

interface CardContentProps extends ViewProps {
    children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, style, ...props }) => (
    <ThemedView
        className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        {...props}
    >
        {children}
    </ThemedView>
);

const CardHeader: React.FC<CardHeaderProps> = ({ children, style, ...props }) => (
    <ThemedView
        className="flex flex-col p-6 pb-2"
        {...props}
    >
        {children}
    </ThemedView>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, style, ...props }) => (
    <ThemedText
        className="text-xl font-semibold"
        {...props}
    >
        {children}
    </ThemedText>
);

const CardContent: React.FC<CardContentProps> = ({ children, style, ...props }) => (
    <ThemedView
        className="p-6"
        {...props}
    >
        {children}
    </ThemedView>
);

export { Card, CardHeader, CardTitle, CardContent };