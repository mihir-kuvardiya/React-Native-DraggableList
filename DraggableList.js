import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  PanResponder,
  Animated,
  SafeAreaView,
} from "react-native";

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function immutableMove(arr, from, to) {
  return arr.reduce((prev, current, idx, self) => {
    if (from === to) {
      prev.push(current);
    }
    if (idx === from) {
      return prev;
    }
    if (from < to) {
      prev.push(current);
    }
    if (idx === to) {
      prev.push(self[from]);
    }
    if (from > to) {
      prev.push(current);
    }
    return prev;
  }, []);
}

const colorMap = {};

const App = () => {
  const [dragging, setDragging] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(-1);
  const [data, setData] = useState(
    Array.from(Array(200), (_, i) => {
      colorMap[i] = getRandomColor();
      return i;
    })
  );

  const point = useRef(new Animated.ValueXY()).current;
  const currentY = useRef(0);
  const scrollOffset = useRef(0);
  const flatlistTopOffset = useRef(0);
  const rowHeight = useRef(0);
  const currentIdx = useRef(-1);
  const active = useRef(false);
  const flatList = useRef(null);
  const flatListHeight = useRef(0);

  const _panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => true,
      onStartShouldSetPanResponderCapture: (_, gestureState) => true,
      onMoveShouldSetPanResponder: (_, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => true,

      onPanResponderGrant: (_, gestureState) => {
        currentIdx.current = yToIndex(gestureState.y0);
        currentY.current = gestureState.y0;
        Animated.event([{ y: point.y }])({
          y: gestureState.y0 - rowHeight.current / 2,
        });
        active.current = true;
        setDragging(true);
        setDraggingIdx(currentIdx.current);
        animateList();
      },
      onPanResponderMove: (_, gestureState) => {
        currentY.current = gestureState.moveY;
        Animated.event([{ y: point.y }])({ y: gestureState.moveY });
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: () => {
        reset();
      },
      onPanResponderTerminate: () => {
        reset();
      },
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  const animateList = () => {
    if (!active.current) {
      return;
    }

    requestAnimationFrame(() => {
      if (currentY.current + 100 > flatListHeight.current) {
        flatList.current.scrollToOffset({
          offset: scrollOffset.current + 20,
          animated: false,
        });
      } else if (currentY.current < 100) {
        flatList.current.scrollToOffset({
          offset: scrollOffset.current - 20,
          animated: false,
        });
      }

      const newIdx = yToIndex(currentY.current);
      if (currentIdx.current !== newIdx) {
        setData((prevData) =>
          immutableMove(prevData, currentIdx.current, newIdx)
        );
        setDraggingIdx(newIdx);
        currentIdx.current = newIdx;
      }

      animateList();
    });
  };

  const yToIndex = (y) => {
    const value = Math.floor(
      (scrollOffset.current + y - flatlistTopOffset.current) / rowHeight.current
    );

    if (value < 0) {
      return 0;
    }

    if (value > data.length - 1) {
      return data.length - 1;
    }

    return value;
  };

  const reset = () => {
    active.current = false;
    setDragging(false);
    setDraggingIdx(-1);
  };

  const renderItem = ({ item, index }, noPanResponder = false) => (
    <View
      onLayout={(e) => {
        rowHeight.current = e.nativeEvent.layout.height;
      }}
      style={{
        padding: 16,
        backgroundColor: colorMap[item],
        flexDirection: "row",
        opacity: draggingIdx === index ? 0 : 1,
      }}
    >
      <View {...(noPanResponder ? {} : _panResponder.panHandlers)}>
        <Text style={{ fontSize: 28 }}>@</Text>
      </View>
      <Text style={{ fontSize: 22, textAlign: "center", flex: 1 }}>{item}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {dragging && (
        <Animated.View
          style={{
            position: "absolute",
            backgroundColor: "black",
            zIndex: 2,
            width: "100%",
            top: point.getLayout().top,
          }}
        >
          {renderItem({ item: data[draggingIdx], index: -1 }, true)}
        </Animated.View>
      )}
      <FlatList
        ref={flatList}
        scrollEnabled={!dragging}
        style={{ width: "100%" }}
        data={data}
        renderItem={renderItem}
        onScroll={(e) => {
          scrollOffset.current = e.nativeEvent.contentOffset.y;
        }}
        onLayout={(e) => {
          flatlistTopOffset.current = e.nativeEvent.layout.y;
          flatListHeight.current = e.nativeEvent.layout.height;
        }}
        scrollEventThrottle={16}
        keyExtractor={(item) => "" + item}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default App;
