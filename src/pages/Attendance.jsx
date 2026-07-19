import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import AttendanceDialog from "@/components/AttendanceDialog";

import { getSchedules } from "@/services/schedule.service";

import { Button } from "@/components/ui/button";

import { WEEKDAYS } from "@/constants/weekday";
import { SESSIONS } from "@/constants/session";

export default function Attendance() {
  const [loading, setLoading] = useState(true);

  const [schedules, setSchedules] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      setLoading(true);

      const data = await getSchedules();

      setSchedules(data);
    } catch (err) {
      console.error(err);

      toast.error("Không tải được lịch học");
    } finally {
      setLoading(false);
    }
  }

  function handleAttendance(schedule) {
    setSelectedSchedule(schedule);

    setDialogOpen(true);
  }

  /**
   * JS:
   * 0 = Sunday
   * 1 = Monday
   * ...
   *
   * DB:
   * 1 = Monday
   * ...
   * 7 = Sunday
   */
  const todayWeekday = useMemo(() => {
    const day = new Date().getDay();

    return day === 0 ? 7 : day;
  }, []);

  const todaySchedules = useMemo(() => {
    return schedules.filter((item) => item.weekday === todayWeekday);
  }, [schedules, todayWeekday]);

  const groupedSchedules = useMemo(() => {
    const map = {};

    SESSIONS.forEach((session) => {
      map[session.value] = [];
    });

    todaySchedules.forEach((schedule) => {
      map[schedule.session].push(schedule);
    });

    return map;
  }, [todaySchedules]);

  const todayLabel = useMemo(() => {
    return WEEKDAYS.find((item) => item.value === todayWeekday)?.label;
  }, [todayWeekday]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Điểm danh</h1>

        <p className="text-sm text-muted-foreground">Hôm nay - {todayLabel}</p>
      </div>

      {loading && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Đang tải...
        </div>
      )}

      {!loading &&
        SESSIONS.map((session) => {
          const items = groupedSchedules[session.value] || [];

          return (
            <div key={session.value} className="rounded-lg border">
              <div className="border-b bg-muted px-4 py-3">
                <h2 className="font-semibold">{session.label}</h2>
              </div>

              <div className="p-4">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Không có lớp học
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((schedule) => (
                      <div key={schedule.id} className="rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                schedule.classes?.color ?? "#3B82F6",
                            }}
                          />

                          <span className="font-medium">
                            {schedule.classes?.name}
                          </span>
                        </div>

                        <div className="mt-4">
                          <Button
                            className="w-full"
                            onClick={() => handleAttendance(schedule)}
                          >
                            Bắt đầu điểm danh
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

      <AttendanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={selectedSchedule}
        onSuccess={loadSchedules}
      />
    </div>
  );
}
