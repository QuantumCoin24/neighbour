import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type NeighbourMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function NeighbourMark({ size = 72, style }: NeighbourMarkProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.24,
        },
        style,
      ]}
    >
      <Image
        source={require('../../../assets/icon.png')}
        resizeMode="cover"
        style={
          {
            width: size,
            height: size,
            borderRadius: size * 0.24,
          } as ImageStyle
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
