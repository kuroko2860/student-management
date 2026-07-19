import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { defaultSchedule } from "@/types/schedule";

import { WEEKDAYS } from "@/constants/weekday";

import { SESSIONS } from "@/constants/session";

import { getClassOptions } from "@/services/class.service";

import { createSchedule, updateSchedule } from "@/services/schedule.service";

export default function ScheduleDialog({
  open,
  onOpenChange,
  selectedSchedule,
  onSuccess,
}) {
  const [form, setForm] = useState(defaultSchedule);

  const [classes, setClasses] = useState([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    loadClasses();

    if (selectedSchedule?.id) {
      // Edit
      setForm({
        class_id: selectedSchedule.class_id,
        weekday: selectedSchedule.weekday,
        session: selectedSchedule.session,
        note: selectedSchedule.note ?? "",
      });
    } else if (selectedSchedule) {
      // Add từ ô đã chọn
      setForm({
        ...defaultSchedule,
        weekday: selectedSchedule.weekday,
        session: selectedSchedule.session,
      });
    } else {
      setForm(defaultSchedule);
    }
  }, [open, selectedSchedule]);

  async function loadClasses() {
    try {
      const data = await getClassOptions();

      setClasses(data);
    } catch (err) {
      console.error(err);

      toast.error("Không tải được danh sách lớp");
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!form.class_id) {
      toast.error("Vui lòng chọn lớp");

      return;
    }

    try {
      setSaving(true);

      if (selectedSchedule?.id) {
        await updateSchedule(selectedSchedule.id, form);

        toast.success("Đã cập nhật lịch");
      } else {
        await createSchedule(form);

        toast.success("Đã thêm lịch");
      }

      onSuccess?.();

      onOpenChange(false);
    } catch (err) {
      console.error(err);

      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedSchedule ? "Sửa lịch học" : "Thêm lịch học"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Lớp học</Label>

            <Select
              value={form.class_id}
              onValueChange={(value) => updateField("class_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>

              <SelectContent>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Thứ</Label>

            <Select
              value={String(form.weekday)}
              onValueChange={(value) => updateField("weekday", Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {WEEKDAYS.map((item) => (
                  <SelectItem key={item.value} value={String(item.value)}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Buổi</Label>

            <Select
              value={String(form.session)}
              onValueChange={(value) => updateField("session", Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {SESSIONS.map((item) => (
                  <SelectItem key={item.value} value={String(item.value)}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>

            <Button disabled={saving} onClick={handleSave}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
