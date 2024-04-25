import { ListItemProps } from '@tonkeeper/uikit/src/components/List/ListItem';
import { ReactNode } from 'react';
import { TonIconProps } from '@tonkeeper/uikit';

export type FiatRate = {
  total: {
    formatted: string;
    raw: string;
  };
  totalTon: {
    formatted: string;
    raw: string;
  };
  percent?: string;
  trend: string;
  price: {
    formatted: string;
    raw: string;
  };
};

export type CellItemToRender = {
  _isHiddenByDefault?: boolean;
  isHidden?: boolean;
  pinnedIndex?: number;
  isFirst?: boolean;
  isLast?: boolean;
  key: string;
  renderPriority: number;
  subtitleStyle?: ListItemProps['subtitleStyle'];
  onPress?: () => void;
  title: string;
  subtitle?: string;
  value?: string | ReactNode;
  subvalue?: string;
  fiatRate?: FiatRate;
  picture?: string;
  renderIcon?: () => JSX.Element;
  renderBottomContent?: () => JSX.Element;
  tag?: string;
};
