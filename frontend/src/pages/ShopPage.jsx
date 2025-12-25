

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, ShoppingCart, ThumbsUp, Shield, CalendarDays, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { constructImageUrl } from '../utils/url';
import PurchaseModal from '../components/PurchaseModal';
import { listContainer, fadeInUp } from '../utils/animations';
import { hexToHslString } from '../utils/colors';
import VerifiedIcons from '../components/VerifiedIcons';


const ProfileFrameCard = ({ item, onPurchaseClick, isLoggedIn }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const displayUser = currentUser || {
        username: 'YourName',
        description: 'Your cool description!',
        pfp_url: '/placeholders/avatar_placeholder.png',
        banner_url: '/placeholders/banner_placeholder.png',
        rank: { name: 'User', display_color: '#AAAAAA' },
        reputation_count: 123,
        clanMembership: { clan: { name: 'YourClan' } },
        first_login: new Date().toISOString(),
    };

    const frameColor = item.cosmetic_data?.color || '#FF4D00';
    const lightFrameColor = hexToHslString(frameColor) ? `hsl(${hexToHslString(frameColor).split(' ')[0]} 60% 70%)` : '#FFFFFF';

    return (
        <div className="relative rounded-xl overflow-hidden p-[2px] h-full flex flex-col">
            <span
                className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite]"
                style={{ background: `conic-gradient(from 90deg at 50% 50%, ${lightFrameColor} 0%, ${frameColor} 50%, ${lightFrameColor} 100%)` }}
            />
            <div className="relative z-10 bg-card rounded-[10px] h-full flex flex-col">
                <CardContent className="flex flex-col items-center text-center p-6 pb-2 flex-grow">
                    <div
                        className="w-full aspect-[16/5] rounded-t-lg bg-cover bg-center"
                        style={{ backgroundImage: `url(${constructImageUrl(displayUser.banner_url)})` }}
                    />
                    <div className="w-[30%] -mt-[18%]">
                        <Avatar className="h-full w-full aspect-square border-4 border-background">
                            <AvatarImage src={constructImageUrl(displayUser.pfp_url)} />
                            <AvatarFallback><User className="h-[60%] w-[60%]" /></AvatarFallback>
                        </Avatar>
                    </div>
                    <h2 className="font-sans mt-4 flex items-center gap-2 text-xl font-bold">
                        {displayUser.username}
                        <VerifiedIcons user={displayUser} />
                    </h2>
                    <p className="text-sm font-semibold" style={{ color: displayUser.rank?.display_color }}>
                        {displayUser.rank?.name}
                    </p>
                </CardContent>
                <CardFooter className="p-4 pt-2 mt-auto flex-col items-stretch gap-4">
                    <div className="w-full text-center">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
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
                                    <TooltipContent><p>You must be logged in to purchase items.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CardFooter>
            </div>
        </div>
    );
};


const ItemCard = ({ item, onPurchaseClick, isLoggedIn }) => {
    const navigate = useNavigate();

    if (item.item_type === 'PROFILE_FRAME') {
        return <ProfileFrameCard item={item} onPurchaseClick={onPurchaseClick} isLoggedIn={isLoggedIn} />;
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
        COMMAND: 'Ranks & Items',
        PROFILE_FRAME: 'Frames',
    };

    const { groupedItems, categories } = useMemo(() => {
        const groups = allItems.reduce((acc, item) => {
            const itemType = item.item_type || 'COMMAND';
            const categoryName = itemTypeToCategoryName[itemType] || itemType;

            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(item);
            return acc;
        }, {});

        const sortedCategories = Object.keys(groups).sort((a, b) => {
            if (a === 'Ranks & Items') return -1;
            if (b === 'Ranks & Items') return 1;
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

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold">Item Shop</h1>

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

