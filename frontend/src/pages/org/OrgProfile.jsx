import React, { useState, useEffect } from "react";
import { getMyOrganization, updateOrganization } from "../../api/organizationApi";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiHome, FiMapPin, FiMail, FiPhone, FiCompass, FiBriefcase } from "react-icons/fi";

const OrgProfile = () => {
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form fields
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [category, setCategory] = useState("BANK");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    useEffect(() => {
        fetchOrgProfile();
    }, []);

    const fetchOrgProfile = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getMyOrganization();
            if (data.organization) {
                const o = data.organization;
                setOrg(o);
                setName(o.name || "");
                setDescription(o.description || "");
                setAddress(o.address || "");
                setCategory(o.category || "BANK");
                setLatitude(o.location?.latitude || "");
                setLongitude(o.location?.longitude || "");
            } else {
                setError("Organization profile not found.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch organization profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setSuccess("Fetched current coordinates successfully.");
                setTimeout(() => setSuccess(""), 3000);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError("Unable to retrieve coordinates automatically. Please input manually.");
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name || !address || latitude === "" || longitude === "") {
            setError("Name, address, latitude, and longitude are required.");
            return;
        }

        setSubmitLoading(true);
        try {
            const updated = await updateOrganization(org._id, {
                name,
                description,
                category,
                address,
                location: {
                    latitude: Number(latitude),
                    longitude: Number(longitude)
                }
            });
            setOrg(updated.organization);
            setIsEditing(false);
            setSuccess("Organization profile updated successfully.");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update organization profile.");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <Loader message="Loading organization profile..." fullPage />;
    if (error && !org) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Organization Profile</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Review and manage your business credentials.</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                )}
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none text-center">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 space-y-6">
                        <div className="text-center pb-4 border-b border-[#35363B]">
                            <div className="w-20 h-20 bg-[#35363B] text-[#EFB477] font-bold rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                                {org?.name?.slice(0, 2).toUpperCase() || "OR"}
                            </div>
                            <h3 className="text-[#F5F5F5] font-bold text-lg">{org?.name}</h3>
                            <span className="text-[10px] font-semibold tracking-wider text-[#EFB477] bg-[#EFB477]/10 px-2.5 py-0.5 rounded-full uppercase mt-1.5 inline-block">
                                {org?.category}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start space-x-3 text-sm">
                                <FiHome className="text-[#A8A8A8] mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-[#707176]">Physical Address</span>
                                    <span className="text-[#F5F5F5] font-medium leading-relaxed">{org?.address}</span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 text-sm">
                                <FiMapPin className="text-[#A8A8A8] mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-[#707176]">Geolocation Coords</span>
                                    <span className="text-[#F5F5F5] font-medium font-mono text-xs">
                                        Lat: {org?.location?.latitude?.toFixed(5)} <br />
                                        Lng: {org?.location?.longitude?.toFixed(5)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Owner account info */}
                    <Card className="p-6 space-y-4">
                        <h4 className="text-xs font-bold text-[#A8A8A8] uppercase tracking-wider">Owner Account</h4>
                        <div className="flex items-start space-x-3 text-sm">
                            <FiMail className="text-[#707176] mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#707176]">Account Username / Email</span>
                                <span className="text-[#F5F5F5] font-medium">{org?.owner?.email}</span>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 text-sm">
                            <FiPhone className="text-[#707176] mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#707176]">Mobile Number</span>
                                <span className="text-[#F5F5F5] font-medium">{org?.owner?.phone}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2">
                    <Card className="p-8">
                        {!isEditing ? (
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#A8A8A8]">About the Organization</h3>
                                <p className="text-sm text-[#F5F5F5] leading-relaxed whitespace-pre-wrap">
                                    {org?.description || "No description provided. Click Edit Profile to add one."}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F5]">Edit Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Organization Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={submitLoading}
                                    />

                                    <Select
                                        label="Category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        options={[
                                            "HOSPITAL",
                                            "COLLEGE",
                                            "GOVERNMENT",
                                            "BANK",
                                            "SERVICE_CENTER",
                                            "OTHER"
                                        ]}
                                        placeholder={null}
                                        required
                                        disabled={submitLoading}
                                    />
                                </div>

                                <Input
                                    label="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter details about your organization..."
                                    disabled={submitLoading}
                                />

                                <Input
                                    label="Physical Address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    disabled={submitLoading}
                                />

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none block">
                                        Geolocation coordinates
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Latitude"
                                            type="number"
                                            step="any"
                                            value={latitude}
                                            onChange={(e) => setLatitude(e.target.value)}
                                            required
                                            disabled={submitLoading}
                                        />
                                        <Input
                                            label="Longitude"
                                            type="number"
                                            step="any"
                                            value={longitude}
                                            onChange={(e) => setLongitude(e.target.value)}
                                            required
                                            disabled={submitLoading}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleUseCurrentLocation}
                                        disabled={submitLoading}
                                        className="mt-2 text-xs font-semibold"
                                    >
                                        <FiCompass className="mr-1.5" /> Use Current Location
                                    </Button>
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#35363B]">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setError("");
                                        }}
                                        disabled={submitLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitLoading}>
                                        {submitLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrgProfile;
