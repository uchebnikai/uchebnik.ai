
import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, 
  RefreshCw, Search, Filter, Trash2, Plus, Zap, Crown, 
  ChevronRight, Edit2, Save, Database, 
  Terminal, ArrowLeft, Mail,
  Clock, Hash, AlertTriangle, Check, DollarSign,
  CreditCard,
  Cloud, Cpu, AlertCircle, RotateCcw, 
  BarChart2, Wifi, HardDrive, Brain, LayoutDashboard,
  PieChart as PieChartIcon, MessageSquare, Flag, CheckSquare,
  Eye, EyeOff, Lock, Radio, LogOut, Snowflake,
  Settings, PartyPopper, Calendar, Palette, ExternalLink,
  // Fix: Added missing icons used in the broadcast and dashboard tabs
  Megaphone, Info
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan, Session } from '../../types';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SUBJECTS } from '../../constants';
import { t } from '../../utils/translations';
import { Lightbox } from '../ui/Lightbox';

// Pricing Constants (Gemini 2.5 Flash)
const PRICE_INPUT_1M = 0.075;
const PRICE_OUTPUT_1M = 0.30;
...