import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTodayDataNew } from '../../hooks/useTodayDataNew';
import {
  Bell,
  Camera,
  ChevronRight,
  FileText,
  Mic,
  Zap,
  Droplet,
  Activity,
  Moon,
  Check,
} from 'lucide-react-native';
import { AnimatedButton } from '../AnimatedButton';
import { AnimatedPressable } from '../AnimatedPressable';
import { ProgressRing } from '../ProgressRing';
import { MetricsSection } from '../MetricsSection';

export default function ClientDashboard() {
  const { data, loading, error, refreshData } = useTodayDataNew();
  const tabHeight = useBottomTabBarHeight();

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const displayName = capitalizeFirstLetter(
    data?.profile?.full_name?.trim() || 'Vinay'
  );

  const numColumns = 2;
  const cardData = [
    { title: 'Hydration', subtitle: '2/8 cups', progress: 25, icon: Droplet },
    { title: 'Steps', subtitle: '3,000/8,000', progress: 35, icon: Activity },
    {
      title: 'Check-in',
      subtitle: 'Complete today',
      progress: 100,
      icon: Check,
    },
    { title: 'Sleep', subtitle: '7.5hr logged', progress: 90, icon: Moon },
  ];

  const todayActions = [
    {
      title: 'Photo',
      icon: <Camera color="#A2ACBA" size={20} strokeWidth={1} />,
    },
    { title: 'Voice', icon: <Mic color="#A2ACBA" size={20} strokeWidth={1} /> },
    {
      title: 'Notes',
      icon: <FileText color="#A2ACBA" size={20} strokeWidth={1} />,
    },
  ];

  return (
    <View className="bg-appBackground flex-1 pt-2 px-4">
      {/* User Greet, Streak, Notification */}
      <View className="flex-row items-center justify-between w-full">
        <Text className="text-white text-2xl font-inter-bold">
          Hi, {displayName}
        </Text>
        <View className="flex-row items-center gap-6">
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full">
            <Text className="text-sm">🔥</Text>
            <Text className="text-base leading-5 text-accent font-semibold">
              5
            </Text>
          </View>
          <Bell color="white" size={22} strokeWidth={1} />
        </View>
      </View>
      <ScrollView
        className="flex-1 mt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: tabHeight + 30 }}
      >
        {/* Workout Card */}

        <View className="bg-cardBackground rounded-2xl border border-cardBorder p-5 backdrop-blur-md shadow-md">
          <Text className="text-sm leading-4 text-textSecondary mb-2">
            Next workout
          </Text>
          <Text className="text-base leading-5 text-textPrimary mb-4">
            Thu, 09 Oct · Full Body · 45 min
          </Text>
          <View className="flex-row gap-3 w-full">
            <AnimatedButton
              onPress={() => console.log('Warm up Pressed!')}
              className="px-4 py-2.5 w-full border border-accent rounded-2xl items-start"
              textClassName="text-textPrimary text-sm font-semibold"
              pressableStyle={{ flex: 1 }}
            >
              Start warm-up
            </AnimatedButton>
            <AnimatedButton
              onPress={() => console.log('View Plan Pressed!')}
              className="px-6 py-2.5 items-center justify-center"
              textClassName="text-textTertiary text-base"
            >
              View plan
            </AnimatedButton>
          </View>
        </View>

        {/* Google Fit Card */}

        <View className="flex-row bg-cardBackground rounded-2xl border border-cardBorder p-5 backdrop-blur-md shadow-md">
          <View className="flex-1">
            <Text className="text-base font-inter-semibold leading-5 text-textPrimary mb-2">
              Connect Health
            </Text>
            <Text className="text-base leading-5 text-textTertiary">
              Google Fit / Apple Health
            </Text>
          </View>
          <View>
            <AnimatedButton
              onPress={() => console.log('Connect pressed!')}
              className="px-4 py-2.5 border border-cardBorder rounded-full justify-center items-center"
              textClassName="text-textPrimary text-sm font-semibold"
            >
              Connect
            </AnimatedButton>
          </View>
        </View>

        {/* Today Diet Card */}

        <View className="bg-cardBackground rounded-2xl border border-cardBorder p-5 backdrop-blur-md shadow-md">
          <View className="flex-row items-center">
            <Text className="flex-1 text-base font-inter-semibold leading-5 text-textPrimary mb-2">
              What did you eat today?
            </Text>
            <TouchableOpacity className="items-center" activeOpacity={0.8}>
              <Text className="text-2xl text-textTertiary">+</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3 justify-center mt-2">
            {todayActions.map((action, index) => (
              <AnimatedPressable
                key={index}
                onPress={() => console.log(`${action.title} pressed!`)}
                style={{ flex: 1 }}
              >
                <View className="px-4 py-2.5 border border-cardBorder rounded-2xl justify-center items-center flex-row gap-2">
                  {action.icon}
                  <Text className="text-textTertiary text-sm font-inter-regular">
                    {action.title}
                  </Text>
                </View>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {/* Daily Habits */}

        <View>
          <Text className="text-textSecondary text-base font-semibold mb-4">
            Daily habits
          </Text>
          <View className="flex-wrap flex-row justify-between">
            {cardData.map((item, index) => {
              const Icon = item.icon;

              return (
                <AnimatedPressable
                  key={index}
                  onPress={() => console.log(`${item.title} pressed`)}
                  style={{
                    width: '48%',
                    marginBottom: index < cardData.length - numColumns ? 12 : 0, // only top row gets bottom margin
                  }}
                >
                  <View className="flex-row items-center gap-3 p-4 border border-cardBorder rounded-2xl bg-cardBackground">
                    {/* Progress Icon */}
                    <View className="relative items-center justify-center">
                      <ProgressRing progress={item.progress} />
                      <View className="absolute">
                        <Icon size={16} color="#2F6BFF" strokeWidth={2} />
                      </View>
                    </View>

                    {/* Text Info */}
                    <View className="flex-1">
                      <Text className="text-textPrimary text-[14px] font-inter-semibold">
                        {item.title}
                      </Text>
                      <Text className="text-[12px] text-textSecondary">
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row justify-between items-center border border-cardBorder p-5 bg-cardBackground rounded-2xl">
          {/* Left section: icon + text */}
          <View className="flex-row items-center">
            <Zap color="#A2ACBA" size={20} strokeWidth={1} />
            <Text className="text-textTertiary ml-2">
              Missed 2 workouts this week
            </Text>
          </View>

          {/* Right section: Reschedule + arrow */}
          <View className="flex-row items-center">
            <Text className="text-accent font-semibold mr-1">Reschedule →</Text>
          </View>
        </View>

        {/* Metrices */}

        <View className="flex-row justify-between">
          <Text className="text-textSecondary text-base font-semibold">
            Metrices
          </Text>
          <View className="flex-row justify-center">
            <Text className="text-textSecondary text-base font-semibold">
              See all
            </Text>
            <ChevronRight color="#A2ACBA" size={20} strokeWidth={1} />
          </View>
        </View>
        <MetricsSection metricsToShow={["bodyweight", "sleep"]} />
      </ScrollView>
    </View>
  );
}
