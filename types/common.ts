// 通用类型定义

export type CardSize = 'small' | 'medium' | 'large';

export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface VerseCardProps extends BaseComponentProps {
    verse: import('./verse').Verse;
    size?: CardSize;
    onClick: () => void;
}
