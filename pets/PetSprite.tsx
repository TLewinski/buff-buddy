/**
 * pets/PetSprite.tsx
 *
 * Renders a pet at a given stage. If the registry has real art
 * (`image !== null`) it renders that Image; otherwise it draws an on-brand
 * styled placeholder — a rarity-tinted rounded silhouette with the pet's name
 * and stage. This is the ONLY component that knows how art is rendered, so
 * dropping in real assets never touches feature screens.
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import type { Rarity, Stage } from '../config/economy';
import { colors, radius, rarityColors, spacing, typography } from '../theme';
import { getPet } from './registry';

interface Props {
  petId: string;
  stage?: Stage;
  /** Square render size in px. */
  size?: number;
  /** Render the sage glow aura beneath the sprite (Home / detail hero). */
  showAura?: boolean;
}

const STAGE_LABEL: Record<Stage, string> = {
  juvenile: 'Juvenile',
  teen: 'Teen',
  adult: 'Adult',
};

/** Adult sprites read a touch larger within the frame than juveniles. */
const STAGE_SCALE: Record<Stage, number> = {
  juvenile: 0.62,
  teen: 0.74,
  adult: 0.86,
};

export function PetSprite({ petId, stage = 'juvenile', size = 200, showAura = false }: Props) {
  const pet = getPet(petId);
  if (!pet) {
    return <View style={[styles.frame, { width: size, height: size }]} />;
  }

  const tint = rarityColors[pet.rarity as Rarity];
  const art = pet.art[stage];
  const inner = size * STAGE_SCALE[stage];

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      {showAura && (
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="aura" cx="50%" cy="58%" r="55%">
              <Stop offset="0%" stopColor={colors.sage} stopOpacity={0.55} />
              <Stop offset="55%" stopColor={colors.sage} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={colors.sage} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size * 0.55} r={size * 0.46} fill="url(#aura)" />
        </Svg>
      )}

      {art.image ? (
        // Real artwork path — used once assets are commissioned and registered.
        <Image source={art.image} style={{ width: inner, height: inner }} resizeMode="contain" />
      ) : (
        <PlaceholderBody size={inner} tint={tint} name={pet.name} stage={stage} />
      )}
    </View>
  );
}

/**
 * The rendered placeholder: a tinted rounded "blob" silhouette with a soft
 * radial gradient, the pet's initial, name, and stage label.
 */
function PlaceholderBody({
  size,
  tint,
  name,
  stage,
}: {
  size: number;
  tint: string;
  name: string;
  stage: Stage;
}) {
  const blobSize = size;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: blobSize, height: blobSize }}>
        <Svg width={blobSize} height={blobSize}>
          <Defs>
            <RadialGradient id="body" cx="50%" cy="40%" r="65%">
              <Stop offset="0%" stopColor={tint} stopOpacity={0.95} />
              <Stop offset="100%" stopColor={tint} stopOpacity={0.55} />
            </RadialGradient>
          </Defs>
          {/* Ground shadow */}
          <Ellipse
            cx={blobSize / 2}
            cy={blobSize * 0.9}
            rx={blobSize * 0.32}
            ry={blobSize * 0.06}
            fill="#000"
            opacity={0.35}
          />
          {/* Body */}
          <Circle cx={blobSize / 2} cy={blobSize * 0.46} r={blobSize * 0.4} fill="url(#body)" />
        </Svg>
        <View style={styles.initialOverlay} pointerEvents="none">
          <Text style={styles.initial}>{name.charAt(0)}</Text>
        </View>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.stage}>{STAGE_LABEL[stage]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialOverlay: {
    position: 'absolute',
    top: '6%',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.background,
    opacity: 0.55,
  },
  name: {
    ...typography.subheading,
    marginTop: spacing.sm,
  },
  stage: {
    ...typography.caption,
    marginTop: 2,
    borderRadius: radius.pill,
  },
});
