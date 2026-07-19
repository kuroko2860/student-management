import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import ScheduleDialog from "@/components/ScheduleDialog";

import { getSchedules, deleteSchedule } from "@/services/schedule.service";

import { Button } from "@/components/ui/button";

import { WEEKDAYS } from "@/constants/weekday";
import { SESSIONS } from "@/constants/session";

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);

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

  function handleAdd(weekday, session) {
    setSelectedSchedule({
      weekday,
      session,
    });

    setDialogOpen(true);
  }

  function handleEdit(schedule) {
    setSelectedSchedule(schedule);

    setDialogOpen(true);
  }

  async function handleDelete(schedule) {
    const ok = window.confirm(`Xóa lịch của ${schedule.classes?.name}?`);

    if (!ok) return;

    try {
      await deleteSchedule(schedule.id);

      toast.success("Đã xóa");

      loadSchedules();
    } catch (err) {
      console.error(err);

      toast.error("Không thể xóa");
    }
  }

  /**
   * map:
   *
   * {
   *   "1-0": [],
   *   "1-1": [],
   *   "1-2": [],
   *   "2-0": []
   * }
   */
  const scheduleMap = useMemo(() => {
    const map = {};

    schedules.forEach((item) => {
      const key = `${item.weekday}-${item.session}`;

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(item);
    });

    return map;
  }, [schedules]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch dạy</h1>

          <p className="text-sm text-muted-foreground">
            Quản lý lịch học theo tuần
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="w-32 border p-3">Buổi</th>

              {WEEKDAYS.map((day) => (
                <th key={day.value} className="border p-3 text-center">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-8 text-center">
                  Đang tải...
                </td>
              </tr>
            )}

            {!loading &&
              SESSIONS.map((session) => (
                <tr key={session.value}>
                  <td className="border bg-muted p-3 font-medium">
                    {session.label}
                  </td>

                  {WEEKDAYS.map((day) => {
                    const key = `${day.value}-${session.value}`;

                    const items = scheduleMap[key] || [];

                    return (
                      <td
                        key={key}
                        className="h-36 min-w-[180px] border align-top"
                      >
                        <div className="flex h-full flex-col p-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="mb-2"
                            onClick={() => handleAdd(day.value, session.value)}
                          >
                            + Thêm
                          </Button>

                          <div className="space-y-2">
                            {items.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="rounded-md border p-2"
                              >
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

                                <div className="mt-2 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(schedule)}
                                  >
                                    Sửa
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(schedule)}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedSchedule={selectedSchedule}
        onSuccess={loadSchedules}
      />
    </div>
  );
}
