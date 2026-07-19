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
    createClass,
    updateClass,
} from "@/services/class.service";

const DEFAULT_FORM = {
    name: "",
    color: "#3B82F6",
    price: 0,
    note: "",
};

export default function ClassDialog({
    open,
    onOpenChange,
    selectedClass,
    onSuccess,
}) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedClass) {
            setForm({
                name: selectedClass.name ?? "",
                color: selectedClass.color ?? "#3B82F6",
                price: selectedClass.price ?? 0,
                note: selectedClass.note ?? "",
            });
        } else {
            setForm(DEFAULT_FORM);
        }
    }, [selectedClass, open]);

    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    async function handleSave() {
        if (!form.name.trim()) {
            toast.error("Tên lớp không được để trống");
            return;
        }

        setSaving(true);

        try {
            if (selectedClass) {
                await updateClass(selectedClass.id, form);

                toast.success("Cập nhật thành công");
            } else {
                await createClass(form);

                toast.success("Đã tạo lớp");
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
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-md">

                <DialogHeader>

                    <DialogTitle>
                        {selectedClass
                            ? "Sửa lớp"
                            : "Thêm lớp"}
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div>

                        <Label>
                            Tên lớp
                        </Label>

                        <Input
                            placeholder="VD: Lớp 12"
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

                        <Label>
                            Học phí / buổi
                        </Label>

                        <Input
                            type="number"
                            value={form.price}
                            onChange={(e) =>
                                updateField(
                                    "price",
                                    Number(e.target.value)
                                )
                            }
                        />

                    </div>

                    <div>

                        <Label>
                            Màu
                        </Label>

                        <Input
                            type="color"
                            value={form.color}
                            onChange={(e) =>
                                updateField(
                                    "color",
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <Label>
                            Ghi chú
                        </Label>

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