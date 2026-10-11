import "./global.css";
import { useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
// Avoid the package barrel, which auto-registers push tokens and crashes in Android Expo Go.
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { requestPermissionsAsync } from "expo-notifications/build/NotificationPermissions";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { StatusBar } from "expo-status-bar";
import {
  Bell,
  Check,
  Clock3,
  Plus,
  ShoppingBasket,
  X,
} from "lucide-react-native";

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const initialItems = [
  { id: 1, name: "Avocados", category: "Produce", done: false },
  { id: 2, name: "Oat milk", category: "Dairy & eggs", done: false },
  { id: 3, name: "Sourdough bread", category: "Bakery", done: false },
  { id: 4, name: "Cherry tomatoes", category: "Produce", done: false },
];

const formatDate = () =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

const formatReminderTime = (minutesAfterMidnight) => {
  const date = new Date();
  date.setHours(
    Math.floor(minutesAfterMidnight / 60),
    minutesAfterMidnight % 60,
    0,
    0,
  );
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export default function App() {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState("");
  const [reminderId, setReminderId] = useState(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [reminderTime, setReminderTime] = useState(17 * 60 + 30);
  const [draftHour, setDraftHour] = useState("05");
  const [draftMinute, setDraftMinute] = useState("30");
  const [draftPeriod, setDraftPeriod] = useState("PM");
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const remaining = items.filter((item) => !item.done).length;
  const completed = items.length - remaining;
  const progress = items.length === 0 ? 0 : completed / items.length;

  const addItem = () => {
    const name = newItem.trim();
    if (!name) return;
    setItems((current) => [
      ...current,
      { id: Date.now(), name, category: "To pick up", done: false },
    ]);
    setNewItem("");
    Keyboard.dismiss();
  };

  const toggleItem = (id) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const scheduleDailyReminder = (time) =>
    scheduleNotificationAsync({
      content: {
        title: "A little grocery reminder",
        body: "Your shopping list is ready when you are.",
        sound: "default",
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: Math.floor(time / 60),
        minute: time % 60,
      },
    });

  const toggleReminder = async () => {
    setReminderBusy(true);
    setReminderError("");

    try {
      if (reminderId) {
        await cancelScheduledNotificationAsync(reminderId);
        setReminderId(null);
        return;
      }

      const permission = await requestPermissionsAsync();
      if (!permission.granted) {
        setReminderError("Allow notifications in your phone settings to get a reminder.");
        return;
      }

      const id = await scheduleDailyReminder(reminderTime);
      setReminderId(id);
    } catch (error) {
      console.error("Could not update grocery reminder:", error);
      setReminderError("Couldn't update the reminder. Please try again.");
    } finally {
      setReminderBusy(false);
    }
  };

  const saveReminderTime = async () => {
    setReminderBusy(true);
    setReminderError("");

    try {
      const hour = Number(draftHour);
      const minute = Number(draftMinute);
      if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
        setReminderError("Enter an hour from 1 to 12.");
        return;
      }
      if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
        setReminderError("Enter minutes from 00 to 59.");
        return;
      }

      const reminderHour = (hour % 12) + (draftPeriod === "PM" ? 12 : 0);
      const newReminderTime = reminderHour * 60 + minute;

      if (reminderId) {
        const permission = await requestPermissionsAsync();
        if (!permission.granted) {
          setReminderError("Allow notifications in your phone settings to get a reminder.");
          return;
        }

        const newReminderId = await scheduleDailyReminder(newReminderTime);
        await cancelScheduledNotificationAsync(reminderId);
        setReminderId(newReminderId);
      }

      setReminderTime(newReminderTime);
      setTimePickerVisible(false);
    } catch (error) {
      console.error("Could not update grocery reminder time:", error);
      setReminderError("Couldn't update the reminder time. Please try again.");
    } finally {
      setReminderBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8F4" }}>
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 36 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-mint">
              <ShoppingBasket size={22} color="#294B3A" strokeWidth={1.8} />
            </View>
            <Text className="text-base font-semibold tracking-tight text-ink">
              little list
            </Text>
          </View>
          <View className="rounded-full bg-white px-3 py-2">
            <Text className="text-xs font-medium text-muted">MY SHOPPING</Text>
          </View>
        </View>

        <Text className="mb-2 text-sm font-medium text-leaf">{formatDate()}</Text>
        <Text className="text-[34px] font-bold leading-[40px] tracking-tight text-ink">
          The grocery{"\n"}list
        </Text>
        <Text className="mb-6 mt-2 text-[15px] text-muted">
          A little planning goes a long way.
        </Text>

        <View className="mb-7 rounded-[26px] bg-forest p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="mb-1 text-sm text-white/70">YOUR PROGRESS</Text>
              <Text className="text-2xl font-semibold text-white">
                {remaining === 0 && items.length > 0
                  ? "All done!"
                  : `${remaining} ${remaining === 1 ? "thing" : "things"} to get`}
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full border border-white/30">
              <Text className="text-sm font-semibold text-white">
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <View
              className="h-full rounded-full bg-[#D4E5B8]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </View>
          <Text className="mt-3 text-xs text-white/70">
            {completed} of {items.length} picked up
          </Text>
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-ink">Your items</Text>
          <Text className="text-sm text-muted">{items.length} items</Text>
        </View>

        <View className="mb-4 flex-row items-center rounded-2xl border border-line bg-white px-4">
          <Plus size={19} color="#879188" strokeWidth={2} />
          <TextInput
            className="min-h-[54px] flex-1 px-3 text-[15px] text-ink"
            placeholder="Add something to your list"
            placeholderTextColor="#A0A8A0"
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            returnKeyType="done"
            accessibilityLabel="New grocery item"
          />
          {newItem.trim().length > 0 && (
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-forest"
              onPress={addItem}
              accessibilityRole="button"
              accessibilityLabel="Add grocery item"
            >
              <Check size={17} color="white" strokeWidth={2.5} />
            </Pressable>
          )}
        </View>

        <View className="mb-8 overflow-hidden rounded-[22px] bg-white px-4">
          {items.length === 0 ? (
            <View className="items-center py-9">
              <Text className="text-sm text-muted">Your list is all clear. Add something above!</Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View
                key={item.id}
                className={`min-h-[73px] flex-row items-center ${index < items.length - 1 ? "border-b border-line" : ""}`}
              >
                <Pressable
                  className={`mr-3 h-[23px] w-[23px] items-center justify-center rounded-full border ${item.done ? "border-leaf bg-leaf" : "border-[#D7DDD5]"}`}
                  onPress={() => toggleItem(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.done }}
                  accessibilityLabel={`${item.name}, ${item.done ? "picked up" : "not picked up"}`}
                >
                  {item.done && <Check size={14} color="white" strokeWidth={2.5} />}
                </Pressable>
                <Pressable
                  className="min-h-[72px] flex-1 justify-center"
                  onPress={() => toggleItem(item.id)}
                >
                  <Text
                    className={`text-[15px] font-medium ${item.done ? "text-muted line-through" : "text-ink"}`}
                  >
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-xs text-muted">{item.category}</Text>
                </Pressable>
                <Pressable
                  className="ml-2 h-9 w-9 items-center justify-center rounded-full"
                  onPress={() => removeItem(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}
                >
                  <X size={17} color="#A0A8A0" strokeWidth={1.8} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View className="rounded-[22px] border border-[#E6E9E2] bg-[#F0F2EC] p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white">
              <Bell size={19} color="#52765C" strokeWidth={1.8} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">A gentle reminder</Text>
              <View className="mt-1 flex-row items-center">
                <Clock3 size={13} color="#879188" strokeWidth={1.8} />
                <Text className="ml-1 text-xs text-muted">
                  Every day at {formatReminderTime(reminderTime)}
                </Text>
              </View>
              <Pressable
                className="mt-2 self-start"
                onPress={() => {
                  const hour = Math.floor(reminderTime / 60);
                  setDraftHour(String(hour % 12 || 12).padStart(2, "0"));
                  setDraftMinute(String(reminderTime % 60).padStart(2, "0"));
                  setDraftPeriod(hour < 12 ? "AM" : "PM");
                  setReminderError("");
                  setTimePickerVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Change reminder time, currently ${formatReminderTime(reminderTime)}`}
              >
                <Text className="text-xs font-semibold text-leaf">Change time</Text>
              </Pressable>
            </View>
            <Pressable
              className={`rounded-full px-4 py-2.5 ${reminderId ? "bg-forest" : "bg-white"}`}
              onPress={toggleReminder}
              disabled={reminderBusy}
              accessibilityRole="switch"
              accessibilityState={{ checked: !!reminderId, disabled: reminderBusy }}
              accessibilityLabel={reminderId ? "Turn off daily reminder" : "Set daily reminder"}
            >
              <Text className={`text-xs font-semibold ${reminderId ? "text-white" : "text-forest"}`}>
                {reminderBusy ? "One sec…" : reminderId ? "On" : "Remind me"}
              </Text>
            </Pressable>
          </View>
          {!!reminderError && (
            <Text className="mt-3 text-xs leading-5 text-[#A14B3B]">{reminderError}</Text>
          )}
        </View>
        <Text className="mt-5 text-center text-xs text-muted">
          Small steps, happy shopping.
        </Text>
      </ScrollView>
      <Modal
        visible={timePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={() => setTimePickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close time picker"
          />
          <View className="w-full rounded-[26px] bg-white p-6">
            <Text className="text-xl font-semibold text-ink">Reminder time</Text>
            <Text className="mt-1 text-sm text-muted">Enter any time of day.</Text>

            <View className="my-7 flex-row items-center justify-center">
              <TextInput
                className="w-[76px] rounded-xl bg-paper py-3 text-center text-3xl font-semibold text-ink"
                value={draftHour}
                onChangeText={(value) => setDraftHour(value.replace(/[^0-9]/g, "").slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                accessibilityLabel="Reminder hour, from 1 to 12"
              />
              <Text className="mx-2 text-3xl font-medium text-muted">:</Text>
              <TextInput
                className="w-[76px] rounded-xl bg-paper py-3 text-center text-3xl font-semibold text-ink"
                value={draftMinute}
                onChangeText={(value) => setDraftMinute(value.replace(/[^0-9]/g, "").slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                accessibilityLabel="Reminder minutes, from 0 to 59"
              />
              <View className="ml-3 gap-2">
                {["AM", "PM"].map((period) => (
                  <Pressable
                    key={period}
                    className={`rounded-lg px-3 py-2 ${draftPeriod === period ? "bg-forest" : "bg-paper"}`}
                    onPress={() => setDraftPeriod(period)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: draftPeriod === period }}
                    accessibilityLabel={period}
                  >
                    <Text className={`text-xs font-semibold ${draftPeriod === period ? "text-white" : "text-ink"}`}>
                      {period}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {!!reminderError && (
              <Text className="mb-4 text-center text-xs leading-5 text-[#A14B3B]">
                {reminderError}
              </Text>
            )}

            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-full bg-paper py-3"
                onPress={() => setTimePickerVisible(false)}
                disabled={reminderBusy}
                accessibilityRole="button"
              >
                <Text className="text-sm font-semibold text-ink">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-full bg-forest py-3"
                onPress={saveReminderTime}
                disabled={reminderBusy}
                accessibilityRole="button"
              >
                <Text className="text-sm font-semibold text-white">
                  {reminderBusy ? "Saving…" : "Save time"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
