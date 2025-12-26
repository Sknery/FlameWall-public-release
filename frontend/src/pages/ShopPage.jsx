

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, ShoppingCart, ThumbsUp, Shield, CalendarDays, User, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { constructImageUrl } from '../utils/url';
import PurchaseModal from '../components/PurchaseModal';
import { listContainer, fadeInUp } from '../utils/animations';
import { hexToHslString } from '../utils/colors';
import VerifiedIcons from '../components/VerifiedIcons';
import PlayerCard from '../components/PlayerCard';


const ProfileFrameCard = ({ item, onPurchaseClick, isLoggedIn }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const displayUser = currentUser ? {
        ...currentUser,
        tags: currentUser.tags || [],
    } : {
        username: 'YourName',
        description: 'Your cool description!',
        pfp_url: '/placeholders/avatar_placeholder.png',
        banner_url: '/placeholders/banner_placeholder.png',
        rank: { name: 'User', display_color: '#AAAAAA' },
        reputation_count: 123,
        clanMembership: { clan: { name: 'YourClan' } },
        first_login: new Date().toISOString(),
        tags: [],
    };

    const frameColor = item.cosmetic_data?.color || '#FF4D00';

    const handleCardClick = () => {
        if (isLoggedIn) {
            onPurchaseClick(item);
        } else {
            navigate('/login');
        }
    };

    return (
        <TooltipProvider>
            <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                    <div onClick={handleCardClick} className="cursor-pointer">
                        <PlayerCard
                            user={displayUser}
                            customFrameColor={frameColor}
                            disableLink={true}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-center">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-lg font-bold mt-1">{item.price} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


const AnimatedAvatarCard = ({ item, onPurchaseClick, isLoggedIn }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const displayUser = currentUser ? {
        ...currentUser,
        tags: currentUser.tags || [],
    } : {
        username: 'YourName',
        description: 'Your cool description!',
        pfp_url: '/placeholders/avatar_placeholder.png',
        banner_url: '/placeholders/banner_placeholder.png',
        rank: { name: 'User', display_color: '#AAAAAA' },
        reputation_count: 123,
        clanMembership: { clan: { name: 'YourClan' } },
        first_login: new Date().toISOString(),
        tags: [],
    };

    const handleCardClick = () => {
        if (isLoggedIn) {
            onPurchaseClick(item);
        } else {
            navigate('/login');
        }
    };

    return (
        <TooltipProvider>
            <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                    <div onClick={handleCardClick} className="cursor-pointer">
                        <PlayerCard
                            user={displayUser}
                            customAvatarUrl={item.image_url}
                            disableLink={true}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-center">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-lg font-bold mt-1">{item.price} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const AnimatedBannerCard = ({ item, onPurchaseClick, isLoggedIn }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const displayUser = currentUser ? {
        ...currentUser,
        tags: currentUser.tags || [],
    } : {
        username: 'YourName',
        description: 'Your cool description!',
        pfp_url: '/placeholders/avatar_placeholder.png',
        banner_url: '/placeholders/banner_placeholder.png',
        rank: { name: 'User', display_color: '#AAAAAA' },
        reputation_count: 123,
        clanMembership: { clan: { name: 'YourClan' } },
        first_login: new Date().toISOString(),
        tags: [],
    };

    const handleCardClick = () => {
        if (isLoggedIn) {
            onPurchaseClick(item);
        } else {
            navigate('/login');
        }
    };

    return (
        <TooltipProvider>
            <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                    <div onClick={handleCardClick} className="cursor-pointer">
                        <PlayerCard
                            user={displayUser}
                            customBannerUrl={item.image_url}
                            disableLink={true}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-center">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-lg font-bold mt-1">{item.price} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const ItemCard = ({ item, onPurchaseClick, isLoggedIn }) => {
    const navigate = useNavigate();

    if (item.item_type === 'PROFILE_FRAME') {
        return <ProfileFrameCard item={item} onPurchaseClick={onPurchaseClick} isLoggedIn={isLoggedIn} />;
    }

    if (item.item_type === 'ANIMATED_AVATAR') {
        return <AnimatedAvatarCard item={item} onPurchaseClick={onPurchaseClick} isLoggedIn={isLoggedIn} />;
    }

    if (item.item_type === 'ANIMATED_BANNER') {
        return <AnimatedBannerCard item={item} onPurchaseClick={onPurchaseClick} isLoggedIn={isLoggedIn} />;
    }

    return (
        <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="p-4">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
                    <img
                        src={constructImageUrl(item.image_url) || `https://robohash.org/${item.item_id}.png?set=set4`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col p-4 pt-0">
                <CardTitle>{item.name}</CardTitle>
                <CardDescription className="mt-1 flex-grow">{item.description}</CardDescription>
                <div className="flex justify-between items-center mt-auto pt-4">
                    <p className="text-xl font-bold">{item.price} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
                    {isLoggedIn ? (
                        <Button onClick={() => onPurchaseClick(item)}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> Purchase
                        </Button>
                    ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => navigate('/login')}>
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Purchase
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>You must be logged in to purchase items.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
        </Card>
    );
};


function ShopPage() {
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setBreadcrumbs } = useBreadcrumbs();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const { isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = useState('');

    const itemTypeToCategoryName = {
        PROFILE_FRAME: 'Frames',
        ANIMATED_AVATAR: 'Animated Avatars',
        ANIMATED_BANNER: 'Animated Banners',
    };

    const { groupedItems, categories } = useMemo(() => {
        // Filter only allowed item types
        const allowedTypes = ['PROFILE_FRAME', 'ANIMATED_AVATAR', 'ANIMATED_BANNER'];
        const filteredItems = allItems.filter(item => allowedTypes.includes(item.item_type));

        const groups = filteredItems.reduce((acc, item) => {
            const itemType = item.item_type;
            const categoryName = itemTypeToCategoryName[itemType] || itemType;

            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(item);
            return acc;
        }, {});

        const sortedCategories = Object.keys(groups).sort((a, b) => {
            return a.localeCompare(b);
        });

        return { groupedItems: groups, categories: sortedCategories };
    }, [allItems]);

    useEffect(() => {
        if (categories.length > 0 && !activeTab) {
            setActiveTab(categories[0]);
        }
    }, [categories, activeTab]);

    const handlePurchaseClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Store', link: '/shop' },
            { label: 'Items' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/shop');
                setAllItems(response.data);
            } catch (err) {
                setError('Failed to load items. The shop might be temporarily unavailable.');
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    const gridColumnsStyle = categories.length > 0 ? { gridTemplateColumns: 'repeat(' + categories.length + ', 1fr)' } : {};

    const externalShopUrl = import.meta.env.VITE_EXTERNAL_SHOP_URL;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-sans text-3xl font-bold">Item Shop</h1>
                {externalShopUrl && (
                    <Button asChild variant="outline">
                        <a href={externalShopUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            External Shop
                        </a>
                    </Button>
                )}
            </div>

            {categories.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full" style={gridColumnsStyle}>
                        {categories.map(category => (
                            <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                        ))}
                    </TabsList>
                    {categories.map(category => (
                         <TabsContent key={category} value={category} className="mt-6">
                            <motion.div
                                variants={listContainer}
                                initial="initial"
                                animate="animate"
                                className="responsive-grid-sm"
                             >
                                {groupedItems[category].map((item) => (
                                    <motion.div
                                        key={item.item_id}
                                        variants={fadeInUp}
                                        className="w-full max-w-[260px]"
                                    >
                                        <ItemCard item={item} onPurchaseClick={handlePurchaseClick} isLoggedIn={isLoggedIn} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">There are no items in the shop yet.</p>
                </div>
            )}

            <PurchaseModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={selectedItem}
                onPurchaseSuccess={() => setIsModalOpen(false)}
            />
        </div>
    );
}

export default ShopPage;

