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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { defaultStudent } from "@/types/student";

import {
    createStudent,
    updateStudent,
} from "@/services/student.service";

import {
    getClassOptions,
} from "@/services/class.service";

export default function StudentDialog({
    open,
    onOpenChange,
    selectedStudent,
    onSuccess,
}) {
    const [form, setForm] = useState(defaultStudent);

    const [classes, setClasses] = useState([]);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;

        loadClasses();

        if (selectedStudent) {
            setForm({
                class_id: selectedStudent.class_id,
                name: selectedStudent.name ?? "",
                phone: selectedStudent.phone ?? "",
                parent_name: selectedStudent.parent_name ?? "",
                parent_phone: selectedStudent.parent_phone ?? "",
                status: selectedStudent.status ?? "active",
                note: selectedStudent.note ?? "",
            });
        } else {
            setForm(defaultStudent);
        }
    }, [open, selectedStudent]);

    async function loadClasses() {
        try {
            const data = await getClassOptions();

            setClasses(data);
        } catch (err) {
            toast.error(err.message);
        }
    }

    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    async function handleSave() {
        if (!form.name.trim()) {
            toast.error("Nhập tên học sinh");
            return;
        }

        if (!form.class_id) {
            toast.error("Chọn lớp");
            return;
        }

        try {
            setSaving(true);

            if (selectedStudent) {
                await updateStudent(
                    selectedStudent.id,
                    form
                );

                toast.success("Đã cập nhật");
            } else {
                await createStudent(form);

                toast.success("Đã thêm học sinh");
            }

            onSuccess?.();

            onOpenChange(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-lg">

                <DialogHeader>

                    <DialogTitle>
                        {selectedStudent
                            ? "Sửa học sinh"
                            : "Thêm học sinh"}
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div>

                        <Label>Lớp</Label>

                        <Select
                            value={form.class_id ?? ""}
                            onValueChange={(value) =>
                                updateField(
                                    "class_id",
                                    value
                                )
                            }
                        >
                            <SelectTrigger>

                                <SelectValue placeholder="Chọn lớp" />

                            </SelectTrigger>

                            <SelectContent>

                                {classes.map((item) => (

                                    <SelectItem
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name}
                                    </SelectItem>

                                ))}

                            </SelectContent>

                        </Select>

                    </div>

                    <div>

                        <Label>Tên học sinh</Label>

                        <Input
                            value={form.name}
                            onChange={(e) =>
                                updateField(
                                    "name",
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <Label>Số điện thoại</Label>

                        <Input
                            value={form.phone}
                            onChange={(e) =>
                                updateField(
                                    "phone",
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <Label>Tên phụ huynh</Label>

                        <Input
                            value={form.parent_name}
                            onChange={(e) =>
                                updateField(
                                    "parent_name",
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <Label>SĐT phụ huynh</Label>

                        <Input
                            value={form.parent_phone}
                            onChange={(e) =>
                                updateField(
                                    "parent_phone",
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <Label>Ghi chú</Label>

                        <Input
                            value={form.note}
                            onChange={(e) =>
                                updateField(
                                    "note",
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>

                <DialogFooter>

                    <Button
                        variant="outline"
                        onClick={() =>
                            onOpenChange(false)
                        }
                    >
                        Hủy
                    </Button>

                    <Button
                        disabled={saving}
                        onClick={handleSave}
                    >
                        {saving
                            ? "Đang lưu..."
                            : "Lưu"}
                    </Button>

                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}